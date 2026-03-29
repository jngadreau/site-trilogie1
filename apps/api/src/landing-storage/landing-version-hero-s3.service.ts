import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { readFile, unlink } from 'node:fs/promises';
import * as path from 'path';
import { AiService } from '../ai/ai.service';
import { DeckLandingImageAssemblyService } from '../site/deck-landing-image-assembly.service';
import type { DeckLandingGlobals } from '../site/deck-modular-landing.types';
import type { DeckSectionMediaSlotV1 } from '../site/deck-modular-landing.types';
import type { LandingImageHistoryEntryV1 } from '../site/deck-modular-landing.types';
import { DeckLandingStorageService } from './deck-landing-storage.service';
import { S3AssetsService } from './s3-assets.service';

/** Variantes hero qui consomment `props.imageUrl` comme bannière principale. */
const HERO_VARIANTS_WITH_IMAGE = new Set(['HeroSplitImageRight', 'HeroFullBleed']);

@Injectable()
export class LandingVersionHeroS3Service {
  constructor(
    private readonly storage: DeckLandingStorageService,
    private readonly s3: S3AssetsService,
    private readonly ai: AiService,
    private readonly assembly: DeckLandingImageAssemblyService,
  ) {}

  async generateHeroToS3(projectId: string, versionId: string): Promise<{
    key: string;
    signedUrl: string;
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
      (s): s is Record<string, unknown> =>
        Boolean(s) && typeof s === 'object' && (s as Record<string, unknown>).id === 'hero',
    );
    if (!hero) {
      throw new BadRequestException('Aucune section hero dans le JSON');
    }

    const variant = typeof hero.variant === 'string' ? hero.variant : '';
    if (!HERO_VARIANTS_WITH_IMAGE.has(variant)) {
      throw new BadRequestException(
        `La variante hero « ${variant} » n’utilise pas imageUrl comme bannière (utiliser HeroSplitImageRight ou HeroFullBleed).`,
      );
    }

    const globals = content.globals;
    if (!globals || typeof globals !== 'object') {
      throw new BadRequestException('content.globals manquant');
    }
    const g = globals as DeckLandingGlobals;

    const media = Array.isArray(hero.media) ? hero.media : [];
    const slotFromMedia = media.find(
      (m): m is DeckSectionMediaSlotV1 =>
        Boolean(m) &&
        typeof m === 'object' &&
        (m as DeckSectionMediaSlotV1).slotId === 'hero' &&
        typeof (m as DeckSectionMediaSlotV1).sceneDescription === 'string',
    );

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

    const prompt = this.assembly.buildImaginePrompt(slot, g);
    const aspectRatio = this.assembly.resolveAspectRatio(slot);
    const slug = typeof content.slug === 'string' && content.slug ? content.slug : 'deck';
    const outputSlug = `${this.assembly.resolveOutputSlug(slug, 'hero', 'hero')}-t${Date.now()}`;

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

    const fileName = path.basename(localPath);
    const key = this.s3.buildDeckLandingAssetKey(projectId, versionId, fileName);
    await this.s3.putObject(key, buf, 'image/png');
    const signedUrl = await this.s3.getSignedGetUrl(key, 604_800);

    const prevProps =
      hero.props && typeof hero.props === 'object' && !Array.isArray(hero.props)
        ? (hero.props as Record<string, unknown>)
        : {};
    hero.props = { ...prevProps, imageUrl: signedUrl };

    const prevPrompts =
      content.imagePrompts && typeof content.imagePrompts === 'object'
        ? (content.imagePrompts as Record<string, unknown>)
        : {};
    content.imagePrompts = { ...prevPrompts, hero: prompt };

    const entry: LandingImageHistoryEntryV1 = {
      id: randomUUID(),
      imageUrl: signedUrl,
      prompt,
      model,
      createdAt: new Date().toISOString(),
    };
    const prevHistory =
      content.imageHistory && typeof content.imageHistory === 'object'
        ? (content.imageHistory as Record<string, LandingImageHistoryEntryV1[]>)
        : {};
    const heroHistory = Array.isArray(prevHistory.hero) ? [...prevHistory.hero] : [];
    heroHistory.push(entry);
    content.imageHistory = { ...prevHistory, hero: heroHistory };

    await this.storage.mergePopulatedLandingDocument(versionId, content);

    return { key, signedUrl, model, prompt };
  }
}
