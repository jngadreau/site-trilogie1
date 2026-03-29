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
import { LandingStructureWizardService } from './landing-structure-wizard.service';

@Injectable()
export class LandingContentPopulateService {
  private readonly logger = new Logger(LandingContentPopulateService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly storage: DeckLandingStorageService,
    private readonly structureWizard: LandingStructureWizardService,
  ) {}

  async populateVersionContent(
    projectId: string,
    versionId: string,
    brief?: string,
  ): Promise<{ model: string; sectionCount: number }> {
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

    await this.storage.mergePopulatedLandingDocument(versionId, doc);

    return { model, sectionCount: sectionOrder.length };
  }
}
