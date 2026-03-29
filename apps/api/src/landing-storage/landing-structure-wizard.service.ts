import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { readFile } from 'fs/promises';
import { DECK_SECTION_CATALOG_FR } from '../site/deck-section-catalog-fr';
import {
  DECK_SECTION_ORDER,
  DECK_VARIANT_CHOICES,
} from '../site/deck-landing-variant-choices';
import type { DeckLandingSectionId } from '../site/deck-landing-section-order';
import { extractFirstJsonObject } from '../site/json-extract.util';
import { getGameContextPath } from '../paths';

export type SuggestStructureResult = {
  sectionOrder: string[];
  variantsBySection: Record<string, string>;
  rationaleMarkdown: string;
  model: string;
};

@Injectable()
export class LandingStructureWizardService {
  private readonly logger = new Logger(LandingStructureWizardService.name);

  constructor(private readonly config: ConfigService) {}

  validateStructure(
    sectionOrder: string[],
    variantsBySection: Record<string, string>,
  ): void {
    if (sectionOrder.length === 0) {
      throw new BadRequestException('sectionOrder ne peut pas être vide');
    }
    const seen = new Set<string>();
    for (const id of sectionOrder) {
      const allowed = DECK_VARIANT_CHOICES[id as DeckLandingSectionId];
      if (!allowed) {
        throw new BadRequestException(`Type de section inconnu: ${id}`);
      }
      if (seen.has(id)) {
        throw new BadRequestException(`Section dupliquée dans l’ordre: ${id}`);
      }
      seen.add(id);
      const v = variantsBySection[id];
      if (!v || typeof v !== 'string') {
        throw new BadRequestException(`Variante manquante pour ${id}`);
      }
      if (!allowed.includes(v)) {
        throw new BadRequestException(
          `Variante invalide pour ${id}: ${v} (attendu: ${allowed.join(' | ')})`,
        );
      }
    }
  }

  /** Squelettes `sections[]` pour le JSON landing (props/media vides). */
  buildContentSections(
    sectionOrder: string[],
    variantsBySection: Record<string, string>,
    slug: string,
  ): Array<Record<string, unknown>> {
    return sectionOrder.map((id) => ({
      id,
      variant: variantsBySection[id],
      props: {},
      media: [],
    }));
  }

  /**
   * Grok : sous-ensemble de sections, ordre libre, variantes exactes — pas d’obligation d’inclure tout le catalogue.
   */
  async suggestStructureAuto(params: {
    gameKey: string;
    projectSlug: string;
    brief?: string;
  }): Promise<SuggestStructureResult> {
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
      deckContext = '(game-context.md absent)';
    }
    const ctxSlice = deckContext.slice(0, 50_000);

    const table = DECK_SECTION_ORDER.map((key) => {
      const allowed = DECK_VARIANT_CHOICES[key].join(', ');
      const role = DECK_SECTION_CATALOG_FR[key];
      return `| \`${key}\` | ${allowed} | ${role} |`;
    }).join('\n');

    const system = `Tu es expert en landing page pour un oracle / jeu de cartes.
Réponds avec **un seul objet JSON** (aucun texte hors JSON).
L'objet doit avoir exactement trois clés :
- "rationaleMarkdown" : string en **français** expliquant les sections choisies, l’ordre, le rythme de page (plusieurs phrases).
- "sectionOrder" : tableau de chaînes — identifiants de section **uniques**, dans l’**ordre d’affichage** souhaité. Tu **ne dois pas** inclure toutes les sections possibles : choisis un **sous-ensemble pertinent** (souvent 6 à 12 sections). **hero** est fortement recommandé en première position pour une landing classique, sauf si le brief demande explicitement autre chose.
- "variantsBySection" : objet dont chaque clé est un id présent dans sectionOrder, et chaque valeur est **exactement** un nom de composant React autorisé pour cette section (chaîne identique caractère pour caractère).`;

    const user = `**Jeu (gameKey)** : \`${params.gameKey}\`
**Projet (slug éditorial)** : \`${params.projectSlug}\`

**Brief éditeur (optionnel)** :
${params.brief?.trim() ? params.brief.trim() : '(aucun)'}

**Contexte deck (extrait)** :
${ctxSlice}

**Tableau des sections possibles** — tu ne choisis qu’un **sous-ensemble**. Pour chaque id retenu, une variante dans la colonne « Variantes autorisées ».

| sectionId | Variantes autorisées | Rôle |
| --- | --- | --- |
${table}

Rappel : chaque id dans sectionOrder apparaît **une seule fois**. Toutes les clés de variantsBySection doivent correspondre aux ids de sectionOrder, et **uniquement** ceux-là.`;

    const client = new OpenAI({ apiKey, baseURL: baseUrl });
    this.logger.log(`Grok suggest-structure gameKey=${params.gameKey} slug=${params.projectSlug}`);

    const completion = await client.chat.completions.create({
      model,
      temperature: 0.42,
      max_tokens: 6_000,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) {
      throw new InternalServerErrorException('Pas de réponse Grok (structure)');
    }

    let parsed: {
      rationaleMarkdown?: string;
      sectionOrder?: string[];
      variantsBySection?: Record<string, string>;
    };
    try {
      parsed = JSON.parse(extractFirstJsonObject(raw)) as typeof parsed;
    } catch {
      throw new InternalServerErrorException('Réponse Grok structure : JSON invalide');
    }

    if (!parsed.rationaleMarkdown || !Array.isArray(parsed.sectionOrder) || !parsed.variantsBySection) {
      throw new InternalServerErrorException('Réponse Grok structure : champs manquants');
    }

    this.validateStructure(parsed.sectionOrder, parsed.variantsBySection);

    return {
      sectionOrder: parsed.sectionOrder,
      variantsBySection: parsed.variantsBySection,
      rationaleMarkdown: parsed.rationaleMarkdown,
      model,
    };
  }
}
