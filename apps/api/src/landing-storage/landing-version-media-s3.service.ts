import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { readFile, unlink } from 'node:fs/promises';
import * as path from 'path';
import { AiService } from '../ai/ai.service';
import { getGeneratedImagesDir, getMirroredDeckCardImagesDir } from '../paths';
import { DeckLandingImageAssemblyService } from '../site/deck-landing-image-assembly.service';
import type { DeckLandingGlobals } from '../site/deck-modular-landing.types';
import type { DeckSectionMediaSlotV1 } from '../site/deck-modular-landing.types';
import type { LandingImageHistoryEntryV1 } from '../site/deck-modular-landing.types';
import {
  applySlotImageUrlToSectionContent,
  HERO_VARIANTS_WITH_IMAGINE_BANNER,
} from './deck-landing-mongo-media-slot-patch';
import { DeckLandingStorageService } from './deck-landing-storage.service';
import { S3AssetsService } from './s3-assets.service';

const HISTORY_MAX = 24;

function positionKey(sectionId: string, slotId: string): string {
  return `${sectionId}:${slotId}`;
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return Boolean(x) && typeof x === 'object' && !Array.isArray(x);
}

@Injectable()
export class LandingVersionMediaS3Service {
  private readonly logger = new Logger(LandingVersionMediaS3Service.name);

  constructor(
    private readonly storage: DeckLandingStorageService,
    private readonly s3: S3AssetsService,
    private readonly ai: AiService,
    private readonly assembly: DeckLandingImageAssemblyService,
  ) {}

  /** Hero seul (rétrocompat) — slot `hero` ou repli `imagePrompts.hero`. */
  async generateHeroToS3(projectId: string, versionId: string): Promise<{
    publicUrl: string;
    model: string;
    prompt: string;
  }> {
    await this.storage.assertVersionBelongsToProject(projectId, versionId);
    if (!this.s3.isReady()) {
      throw new BadRequestException('S3 non configuré');
    }

    const v = await this.storage.getVersion(versionId);
    const content = JSON.parse(JSON.stringify(v.content ?? {})) as Record<string, unknown>;
    const sections = content.sections;
    if (!Array.isArray(sections)) {
      throw new BadRequestException('content.sections manquant ou invalide');
    }

    const hero = sections.find(
      (s): s is Record<string, unknown> => isRecord(s) && s.id === 'hero',
    );
    if (!hero) {
      throw new BadRequestException('Aucune section hero dans le JSON');
    }

    const variant = typeof hero.variant === 'string' ? hero.variant : '';
    if (!HERO_VARIANTS_WITH_IMAGINE_BANNER.has(variant)) {
      throw new BadRequestException(
        `La variante hero « ${variant} » n’utilise pas une bannière Imagine (voir HeroSplitImageRight, HeroFullBleed, HeroGlowVault, HeroParallaxLayers).`,
      );
    }

    const globals = content.globals;
    if (!globals || typeof globals !== 'object') {
      throw new BadRequestException('content.globals manquant');
    }
    const g = globals as DeckLandingGlobals;

    const media = Array.isArray(hero.media) ? hero.media : [];
    const slotFromMedia = media.find((m): m is DeckSectionMediaSlotV1 => {
      if (!isRecord(m)) return false;
      const s = m as unknown as DeckSectionMediaSlotV1;
      return s.slotId === 'hero' && typeof s.sceneDescription === 'string';
    });

    const imagePrompts = content.imagePrompts as Record<string, unknown> | undefined;
    const heroPromptFallback =
      typeof imagePrompts?.hero === 'string' && imagePrompts.hero.trim()
        ? imagePrompts.hero.trim()
        : '';

    let slot: DeckSectionMediaSlotV1;
    if (slotFromMedia?.sceneDescription?.trim()) {
      slot = slotFromMedia;
    } else if (heroPromptFallback) {
      slot = {
        slotId: 'hero',
        aspectRatio: '16:9',
        sceneDescription: heroPromptFallback,
      };
    } else {
      throw new BadRequestException(
        'Slot média hero (`media` avec slotId hero + sceneDescription) ou `imagePrompts.hero` requis.',
      );
    }

    const slug = typeof content.slug === 'string' && content.slug ? content.slug : 'deck';
    const result = await this.imagineSlotToS3(projectId, versionId, slug, g, slot, 'hero');

    const appliedHero = applySlotImageUrlToSectionContent(hero, 'hero', variant, slot, result.publicUrl);
    if (!appliedHero) {
      throw new InternalServerErrorException('Impossible d’appliquer l’image hero sur props');
    }

    const prevPrompts =
      content.imagePrompts && typeof content.imagePrompts === 'object'
        ? (content.imagePrompts as Record<string, unknown>)
        : {};
    content.imagePrompts = { ...prevPrompts, hero: result.prompt };

    this.appendHistory(content, 'hero', 'hero', {
      id: randomUUID(),
      imageUrl: result.publicUrl,
      prompt: result.prompt,
      model: result.model,
      createdAt: new Date().toISOString(),
    });

    await this.storage.mergePopulatedLandingDocument(versionId, content);

    return {
      publicUrl: result.publicUrl,
      model: result.model,
      prompt: result.prompt,
    };
  }

  /**
   * Pour chaque entrée `media` avec `sceneDescription`, Imagine → S3 → props si le couple section/slot est supporté.
   */
  async generateAllImagineMediaToS3(
    projectId: string,
    versionId: string,
  ): Promise<{
    generated: Array<{
      sectionId: string;
      slotId: string;
      publicUrl: string;
      model: string;
    }>;
    skipped: Array<{ sectionId: string; slotId: string; reason: string }>;
  }> {
    await this.storage.assertVersionBelongsToProject(projectId, versionId);
    if (!this.s3.isReady()) {
      throw new BadRequestException('S3 non configuré');
    }

    const v = await this.storage.getVersion(versionId);
    const content = JSON.parse(JSON.stringify(v.content ?? {})) as Record<string, unknown>;
    const sections = content.sections;
    if (!Array.isArray(sections)) {
      throw new BadRequestException('content.sections manquant ou invalide');
    }

    const globals = content.globals;
    if (!globals || typeof globals !== 'object') {
      throw new BadRequestException('content.globals manquant');
    }
    const g = globals as DeckLandingGlobals;

    const slug = typeof content.slug === 'string' && content.slug ? content.slug : 'deck';
    const generated: Array<{
      sectionId: string;
      slotId: string;
      publicUrl: string;
      model: string;
    }> = [];
    const skipped: Array<{ sectionId: string; slotId: string; reason: string }> = [];

    for (const sec of sections) {
      if (!isRecord(sec)) continue;
      const sectionId = typeof sec.id === 'string' ? sec.id : '';
      const variant = typeof sec.variant === 'string' ? sec.variant : '';
      if (!sectionId) continue;

      if (sectionId === 'hero' && !HERO_VARIANTS_WITH_IMAGINE_BANNER.has(variant)) {
        const slots = Array.isArray(sec.media) ? sec.media : [];
        for (const raw of slots) {
          if (!isRecord(raw)) continue;
          const sid = typeof raw.slotId === 'string' ? raw.slotId : '';
          skipped.push({
            sectionId,
            slotId: sid || '(sans slotId)',
            reason: `variante hero « ${variant} » sans bannière Imagine`,
          });
        }
        continue;
      }

      const slots = Array.isArray(sec.media) ? sec.media : [];
      for (const raw of slots) {
        if (!isRecord(raw)) continue;
        const slot = raw as unknown as DeckSectionMediaSlotV1;
        const slotId = slot.slotId?.trim() || '';
        if (!slotId) {
          skipped.push({ sectionId, slotId: '', reason: 'slotId manquant' });
          continue;
        }
        if (!slot.sceneDescription?.trim()) {
          skipped.push({ sectionId, slotId, reason: 'sceneDescription vide' });
          continue;
        }

        const secProbe = JSON.parse(JSON.stringify(sec)) as Record<string, unknown>;
        if (!applySlotImageUrlToSectionContent(secProbe, sectionId, variant, slot, '__probe__')) {
          skipped.push({
            sectionId,
            slotId,
            reason: 'emplacement JSON non mappé pour ce slot',
          });
          continue;
        }

        try {
          const r = await this.imagineSlotToS3(projectId, versionId, slug, g, slot, sectionId);
          const applied = applySlotImageUrlToSectionContent(
            sec,
            sectionId,
            variant,
            slot,
            r.publicUrl,
          );
          if (!applied) {
            skipped.push({ sectionId, slotId, reason: 'application props refusée après génération' });
            continue;
          }

          this.appendHistory(content, sectionId, slotId, {
            id: randomUUID(),
            imageUrl: r.publicUrl,
            prompt: r.prompt,
            model: r.model,
            createdAt: new Date().toISOString(),
          });

          generated.push({
            sectionId,
            slotId,
            publicUrl: r.publicUrl,
            model: r.model,
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          this.logger.warn(`Imagine échoué ${sectionId}/${slotId}: ${msg}`);
          skipped.push({ sectionId, slotId, reason: msg });
        }
      }
    }

    if (generated.length > 0) {
      await this.storage.mergePopulatedLandingDocument(versionId, content);
    }

    return { generated, skipped };
  }

  /**
   * Parcourt les champs `imageUrl` dans `content` : chemins `/ai/generated-images/…`,
   * `/images/…`, http(s) → upload stockage objet → remplace par chemin API public (`/site/landing-storage/…/assets/file/…`).
   */
  async hydrateImageUrlsToS3(projectId: string, versionId: string): Promise<{
    replaced: Array<{ path: string; publicUrl: string }>;
    skipped: Array<{ path: string; reason: string }>;
  }> {
    await this.storage.assertVersionBelongsToProject(projectId, versionId);
    if (!this.s3.isReady()) {
      throw new BadRequestException('S3 non configuré');
    }

    const v = await this.storage.getVersion(versionId);
    const content = JSON.parse(JSON.stringify(v.content ?? {})) as Record<string, unknown>;

    const urlCache = new Map<string, string>();
    const replaced: Array<{ path: string; publicUrl: string }> = [];
    const skipped: Array<{ path: string; reason: string }> = [];

    const targets = this.collectImageUrlTargets(content);
    const genDir = getGeneratedImagesDir();
    const deckCardsDir = getMirroredDeckCardImagesDir();
    const webPublicDir = path.resolve(process.cwd(), '..', 'web', 'public');

    for (const t of targets) {
      const url = t.url.trim();
      if (!url || this.looksLikeAlreadyOurS3OrSigned(url)) {
        skipped.push({ path: t.path, reason: 'déjà S3 ou vide' });
        continue;
      }

      try {
        let cached = urlCache.get(url);
        if (!cached) {
          const bufAndType = await this.resolveUrlToBuffer(url, {
            genDir,
            deckCardsDir,
            webPublicDir,
          });
          if (!bufAndType) {
            skipped.push({ path: t.path, reason: 'source introuvable ou non supportée' });
            continue;
          }
          const ext =
            bufAndType.ext ||
            (bufAndType.contentType.includes('png')
              ? '.png'
              : bufAndType.contentType.includes('webp')
                ? '.webp'
                : bufAndType.contentType.includes('jpeg')
                  ? '.jpg'
                  : '.bin');
          const fileName = `hydrate-${randomUUID().slice(0, 8)}${ext}`;
          const objectKey = this.s3.buildDeckLandingAssetKey(projectId, versionId, fileName);
          await this.s3.putObject(objectKey, bufAndType.buffer, bufAndType.contentType);
          const assetName = objectKey.split('/').pop() ?? fileName;
          cached = this.s3.buildPublicAssetUrlPath(projectId, versionId, assetName);
          urlCache.set(url, cached);
          replaced.push({ path: t.path, publicUrl: cached });
        }
        t.set(cached);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        skipped.push({ path: t.path, reason: msg });
      }
    }

    if (replaced.length > 0) {
      await this.storage.mergePopulatedLandingDocument(versionId, content);
    }

    return { replaced, skipped };
  }

  private looksLikeAlreadyOurS3OrSigned(u: string): boolean {
    if (u.includes('X-Amz-Algorithm=') || u.includes('X-Amz-Credential=')) {
      return true;
    }
    if (u.includes('/deck-landings/') && u.startsWith('http')) {
      return true;
    }
    if (u.startsWith('/site/landing-storage/') && u.includes('/assets/file/')) {
      return true;
    }
    return false;
  }

  private collectImageUrlTargets(
    root: unknown,
  ): Array<{ path: string; url: string; set: (v: string) => void }> {
    const out: Array<{ path: string; url: string; set: (v: string) => void }> = [];

    const walk = (node: unknown, p: string): void => {
      if (!isRecord(node)) {
        if (Array.isArray(node)) {
          node.forEach((item, i) => walk(item, `${p}[${i}]`));
        }
        return;
      }
      for (const [k, v] of Object.entries(node)) {
        const next = `${p}.${k}`;
        if (k === 'imageUrl' && typeof v === 'string' && v.length > 0) {
          out.push({
            path: next,
            url: v,
            set: (nv: string) => {
              node[k] = nv;
            },
          });
        } else {
          walk(v, next);
        }
      }
    };

    walk(root, 'content');
    return out;
  }

  private async resolveUrlToBuffer(
    url: string,
    dirs: { genDir: string; deckCardsDir: string; webPublicDir: string },
  ): Promise<{ buffer: Buffer; contentType: string; ext?: string } | null> {
    if (url.startsWith('/ai/generated-images/deck-cards/')) {
      const name = path.basename(url.split('?')[0] ?? '');
      if (!/^[\w.-]+\.(png|jpe?g|webp)$/i.test(name)) {
        return null;
      }
      const full = path.join(dirs.deckCardsDir, name);
      const buf = await readFile(full);
      return {
        buffer: buf,
        contentType: name.toLowerCase().endsWith('.webp')
          ? 'image/webp'
          : name.toLowerCase().endsWith('.jpg') || name.toLowerCase().endsWith('.jpeg')
            ? 'image/jpeg'
            : 'image/png',
        ext: path.extname(name),
      };
    }

    if (url.startsWith('/ai/generated-images/')) {
      const name = path.basename(url.split('?')[0] ?? '');
      if (!/^[\w.-]+\.(png|jpe?g|webp)$/i.test(name)) {
        return null;
      }
      const full = path.join(dirs.genDir, name);
      const buf = await readFile(full);
      return {
        buffer: buf,
        contentType: name.toLowerCase().endsWith('.webp')
          ? 'image/webp'
          : name.toLowerCase().endsWith('.jpg') || name.toLowerCase().endsWith('.jpeg')
            ? 'image/jpeg'
            : 'image/png',
        ext: path.extname(name),
      };
    }

    if (url.startsWith('/images/')) {
      const rel = url.replace(/^\/+/, '');
      const full = path.join(dirs.webPublicDir, rel);
      const resolved = path.resolve(full);
      if (!resolved.startsWith(path.resolve(dirs.webPublicDir))) {
        return null;
      }
      const buf = await readFile(resolved);
      const ext = path.extname(resolved).toLowerCase();
      const ct =
        ext === '.webp'
          ? 'image/webp'
          : ext === '.jpg' || ext === '.jpeg'
            ? 'image/jpeg'
            : ext === '.png'
              ? 'image/png'
              : 'application/octet-stream';
      return { buffer: buf, contentType: ct, ext };
    }

    if (url.startsWith('http://') || url.startsWith('https://')) {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 45_000);
      try {
        const res = await fetch(url, { signal: ctrl.signal, redirect: 'follow' });
        if (!res.ok) {
          return null;
        }
        const ct = res.headers.get('content-type')?.split(';')[0]?.trim() || 'application/octet-stream';
        if (!ct.startsWith('image/') && ct !== 'application/octet-stream') {
          return null;
        }
        const ab = await res.arrayBuffer();
        return { buffer: Buffer.from(ab), contentType: ct.startsWith('image/') ? ct : 'image/png' };
      } finally {
        clearTimeout(t);
      }
    }

    return null;
  }

  private appendHistory(
    content: Record<string, unknown>,
    sectionId: string,
    slotId: string,
    entry: LandingImageHistoryEntryV1,
  ): void {
    const key = positionKey(sectionId, slotId);
    const prevHistory =
      content.imageHistory && typeof content.imageHistory === 'object'
        ? (content.imageHistory as Record<string, LandingImageHistoryEntryV1[]>)
        : {};
    const list = Array.isArray(prevHistory[key]) ? [...prevHistory[key]] : [];
    list.push(entry);
    content.imageHistory = { ...prevHistory, [key]: list.slice(-HISTORY_MAX) };
  }

  private async imagineSlotToS3(
    projectId: string,
    versionId: string,
    slug: string,
    globals: DeckLandingGlobals,
    slot: DeckSectionMediaSlotV1,
    sectionIdForSlug: string,
  ): Promise<{ publicUrl: string; model: string; prompt: string }> {
    const prompt = this.assembly.buildImaginePrompt(slot, globals);
    const aspectRatio = this.assembly.resolveAspectRatio(slot);
    const outputSlug = `${this.assembly.resolveOutputSlug(slug, sectionIdForSlug, slot.slotId)}-t${Date.now()}`;

    const { path: localPath, model } = await this.ai.generateImageToFile({
      prompt,
      outputSlug,
      aspectRatio,
    });

    let buf: Buffer;
    try {
      buf = await readFile(localPath);
    } catch {
      throw new InternalServerErrorException('Lecture du fichier image généré impossible');
    }

    try {
      await unlink(localPath);
    } catch {
      /* ignore */
    }

    const localBase = path.basename(localPath);
    const key = this.s3.buildDeckLandingAssetKey(projectId, versionId, localBase);
    await this.s3.putObject(key, buf, 'image/png');
    const assetFileName = key.split('/').pop() ?? localBase;
    const publicUrl = this.s3.buildPublicAssetUrlPath(projectId, versionId, assetFileName);

    return { publicUrl, model, prompt };
  }
}
