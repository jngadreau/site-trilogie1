import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { readFile } from 'fs/promises';
import * as path from 'path';
import { getDeckModularLandingPromptsDir, getGameContextPath, getWebAppSectionsDir } from '../paths';
import { readDeckSectionSpecByVariant } from '../site/deck-section-specs.util';
import { extractFirstJsonObject } from '../site/json-extract.util';
import { DeckLandingStorageService } from './deck-landing-storage.service';
import { normalizeImageSlotsInLandingDoc } from './landing-image-slots-normalize';
import { LandingStructureWizardService } from './landing-structure-wizard.service';
import { LandingVersionMediaS3Service } from './landing-version-media-s3.service';
import { S3AssetsService } from './s3-assets.service';

function versionWantsAutoImagine(v: { buildOptions?: unknown }): boolean {
  const o = v.buildOptions as { autoGenerateImages?: boolean } | undefined;
  if (o && o.autoGenerateImages === false) return false;
  return true;
}

@Injectable()
export class LandingContentPopulateService {
  private readonly logger = new Logger(LandingContentPopulateService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly storage: DeckLandingStorageService,
    private readonly structureWizard: LandingStructureWizardService,
    private readonly mediaS3: LandingVersionMediaS3Service,
    private readonly s3: S3AssetsService,
  ) {}

  async populateVersionContent(
    projectId: string,
    versionId: string,
    opts?: { brief?: string; skipAutoImagine?: boolean },
  ): Promise<{
    model: string;
    sectionCount: number;
    autoImagine?: { generated: number; skipped: number };
  }> {
    const brief = opts?.brief;
    const skipAutoImagine = opts?.skipAutoImagine === true;

    await this.storage.assertVersionBelongsToProject(projectId, versionId);
    const proj = await this.storage.getProject(projectId);
    const v = await this.storage.getVersion(versionId);

    const sectionOrder = v.sectionOrder ?? [];
    const variantsBySection = (v.variantsBySection ?? {}) as Record<string, string>;

    if (sectionOrder.length === 0) {
      throw new BadRequestException(
        'Aucune structure : définis sectionOrder + variantes (étape Structure) avant de générer le contenu.',
      );
    }

    this.structureWizard.validateStructure(sectionOrder, variantsBySection);

    const apiKey = this.config.get<string>('GROK_API_KEY') ?? '';
    const baseUrl = this.config.get<string>('GROK_API_URL') ?? 'https://api.x.ai/v1';
    const model =
      this.config.get<string>('GROK_DECK_LANDING_MODEL')?.trim() ||
      this.config.get<string>('GROK_TEXT_MODEL')?.trim() ||
      'grok-3-mini';

    if (!apiKey) {
      throw new InternalServerErrorException('GROK_API_KEY is not configured');
    }

    let deckContext = '';
    try {
      deckContext = await readFile(getGameContextPath(), 'utf8');
    } catch {
      deckContext =
        '(game-context.md absent — lance POST /site/generate-game-context pour un meilleur résultat)';
    }
    const ctxSlice = deckContext.slice(0, 55_000);

    const variantMap: Record<string, string> = {};
    for (const id of sectionOrder) {
      variantMap[id] = variantsBySection[id];
    }

    const seenSpecs = new Set<string>();
    const specChunks: string[] = [];
    for (const id of sectionOrder) {
      const variant = variantsBySection[id];
      if (seenSpecs.has(variant)) continue;
      seenSpecs.add(variant);
      const body = await readDeckSectionSpecByVariant(getWebAppSectionsDir(), variant);
      specChunks.push(`## Spécification — \`${variant}\`\n\n${body.trim()}`);
    }
    const specsBundle = specChunks.join('\n\n---\n\n');

    const system = await readFile(
      path.join(getDeckModularLandingPromptsDir(), '07-editor-subset-system.md'),
      'utf8',
    );

    const orderLine = sectionOrder.map((id) => `\`${id}\` (${variantsBySection[id]})`).join(' → ');

    const user = `## Contexte deck (extrait)

${ctxSlice}

---

## Projet éditeur

- **gameKey** : \`${proj.gameKey}\`
- **slug landing (JSON)** : \`${proj.slug}\`
- **Titre projet** : ${proj.title ? proj.title : '(non renseigné)'}
- **Description projet** : ${proj.description ? proj.description : '(non renseignée)'}
- **Brief génération (optionnel)** : ${brief?.trim() ? brief.trim() : '(aucun)'}

---

## Variantes imposées (ne modifie ni les clés ni les valeurs)

\`\`\`json
${JSON.stringify(variantMap, null, 2)}
\`\`\`

---

## Ordre des sections (**obligatoire**)

Le tableau JSON \`sections\` doit contenir **exactement** ${sectionOrder.length} objets, dans cet ordre :

${orderLine}

Pour chaque indice \`i\`, \`sections[i].id\` = le i-ème id ci-dessus, et \`sections[i].variant\` = la variante imposée pour cet id.

---

## Specs des variantes (Markdown)

${specsBundle}

---

## Schéma JSON à produire (**uniquement** ceci, sans texte autour)

\`\`\`json
{
  "version": 1,
  "slug": "${proj.slug}",
  "imagePrompts": {
    "hero": "optionnel — prompt anglais pour Imagine si hero avec bannière"
  },
  "globals": {
    "accent": "#hex",
    "background": "#hex",
    "surface": "#hex",
    "text": "#hex",
    "textMuted": "#hex",
    "fontHeading": "string",
    "fontBody": "string",
    "radius": "12px",
    "visualBrief": "obligatoire — 2 à 6 phrases FR : ton, ambiance visuelle, cohérence avec le jeu (sert aux prompts image)",
    "fontImportNote": "optionnel",
    "fontImportHref": "optionnel"
  },
  "sections": [
    ${sectionOrder
      .map(
        (id) =>
          `    { "id": "${id}", "variant": "${variantsBySection[id]}", "props": { /* … champs obligatoires selon specs … */ }, "media": [] }`,
      )
      .join(',\n')}
  ]
}
\`\`\`

Remplis \`props\` et \`media\` conformément aux specs. Réponds **uniquement** avec l’objet JSON final.`;

    const client = new OpenAI({ apiKey, baseURL: baseUrl });
    this.logger.log(`Grok populate-content version=${versionId} sections=${sectionOrder.length}`);

    const completion = await client.chat.completions.create({
      model,
      temperature: 0.42,
      max_tokens: 16_000,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) {
      throw new InternalServerErrorException('Pas de réponse Grok (populate)');
    }

    let doc: Record<string, unknown>;
    try {
      doc = JSON.parse(extractFirstJsonObject(raw)) as Record<string, unknown>;
    } catch (e) {
      this.logger.error(`populate JSON parse: ${(e as Error).message}`);
      throw new InternalServerErrorException('Réponse Grok populate : JSON invalide');
    }

    if (doc.version !== 1) {
      throw new InternalServerErrorException('JSON populate : version !== 1');
    }
    if (typeof doc.slug !== 'string' || !doc.slug.trim()) {
      doc.slug = proj.slug;
    }
    if (doc.slug !== proj.slug) {
      doc.slug = proj.slug;
    }

    const secs = doc.sections;
    if (!Array.isArray(secs)) {
      throw new InternalServerErrorException('JSON populate : sections manquant ou non tableau');
    }
    if (secs.length !== sectionOrder.length) {
      throw new InternalServerErrorException(
        `JSON populate : ${secs.length} sections reçues, ${sectionOrder.length} attendues`,
      );
    }

    for (let i = 0; i < sectionOrder.length; i++) {
      const row = secs[i] as Record<string, unknown>;
      const wantId = sectionOrder[i];
      const wantVar = variantsBySection[wantId];
      if (row.id !== wantId || row.variant !== wantVar) {
        throw new InternalServerErrorException(
          `Section index ${i}: attendu id=${wantId} variant=${wantVar}, reçu id=${String(row.id)} variant=${String(row.variant)}`,
        );
      }
      if (!Array.isArray(row.media)) {
        row.media = [];
      }
    }

    normalizeImageSlotsInLandingDoc(doc);

    await this.storage.mergePopulatedLandingDocument(versionId, doc);

    let autoImagine: { generated: number; skipped: number } | undefined;
    if (
      !skipAutoImagine &&
      versionWantsAutoImagine(v as { buildOptions?: unknown }) &&
      this.s3.isReady()
    ) {
      try {
        const r = await this.mediaS3.generateAllImagineMediaToS3(projectId, versionId);
        autoImagine = {
          generated: r.generated.length,
          skipped: r.skipped.length,
        };
        this.logger.log(
          `populate auto-imagine version=${versionId} generated=${autoImagine.generated} skipped=${autoImagine.skipped}`,
        );
      } catch (e) {
        this.logger.warn(
          `populate auto-imagine ignoré version=${versionId}: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    } else if (!skipAutoImagine && versionWantsAutoImagine(v as { buildOptions?: unknown })) {
      this.logger.warn('populate auto-imagine sauté : S3 non configuré');
    }

    return { model, sectionCount: sectionOrder.length, ...(autoImagine ? { autoImagine } : {}) };
  }
}
