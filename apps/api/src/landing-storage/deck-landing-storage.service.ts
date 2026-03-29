import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import type { CreateDeckLandingProjectDto } from './dto/create-deck-landing-project.dto';
import type { CreateDeckLandingVersionDto } from './dto/create-deck-landing-version.dto';
import type { UpdateDeckLandingProjectDto } from './dto/update-deck-landing-project.dto';
import type { UpdateDeckLandingVersionDto } from './dto/update-deck-landing-version.dto';
import type { PatchDeckLandingContentGlobalsDto } from './dto/patch-deck-landing-content-globals.dto';
import type { PatchDeckLandingImageSlotDto } from './dto/patch-deck-landing-image-slot.dto';
import { applySlotImageUrlToSectionContent } from './deck-landing-mongo-media-slot-patch';
import { appendLandingImageHistory } from './landing-image-history.util';
import { normalizeImageSlotsInLandingDoc } from './landing-image-slots-normalize';
import { LandingStructureWizardService } from './landing-structure-wizard.service';
import {
  DeckLandingProject,
  type DeckLandingProjectDocument,
} from './schemas/deck-landing-project.schema';
import {
  DeckLandingVersion,
  type DeckLandingVersionDocument,
} from './schemas/deck-landing-version.schema';
import type { DeckSectionMediaSlotV1 } from '../site/deck-modular-landing.types';

function isRecord(x: unknown): x is Record<string, unknown> {
  return Boolean(x) && typeof x === 'object' && !Array.isArray(x);
}

@Injectable()
export class DeckLandingStorageService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(DeckLandingProject.name)
    private readonly projectModel: Model<DeckLandingProjectDocument>,
    @InjectModel(DeckLandingVersion.name)
    private readonly versionModel: Model<DeckLandingVersionDocument>,
    private readonly structureWizard: LandingStructureWizardService,
  ) {}

  mongoConnected(): boolean {
    return this.connection.readyState === 1;
  }

  /** 0 disconnected, 1 connected, 2 connecting, 3 disconnecting */
  getMongoReadyState(): number {
    return this.connection.readyState;
  }

  async createProject(dto: CreateDeckLandingProjectDto) {
    try {
      const doc = await this.projectModel.create({
        gameKey: dto.gameKey,
        slug: dto.slug,
        title: dto.title,
        description: dto.description,
        sectionDescriptions: dto.sectionDescriptions ?? {},
      });
      return doc.toJSON();
    } catch (e: unknown) {
      const err = e as { code?: number };
      if (err.code === 11_000) {
        throw new ConflictException(
          `Projet déjà existant pour gameKey=${dto.gameKey} slug=${dto.slug}`,
        );
      }
      throw e;
    }
  }

  async listProjects(gameKey?: string) {
    const q = gameKey ? { gameKey } : {};
    return this.projectModel.find(q).sort({ updatedAt: -1 }).lean().exec();
  }

  async getProject(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Identifiant projet invalide');
    }
    const doc = await this.projectModel.findById(id).lean().exec();
    if (!doc) throw new NotFoundException('Projet introuvable');
    return doc;
  }

  async updateProject(id: string, dto: UpdateDeckLandingProjectDto) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Identifiant projet invalide');
    }
    const doc = await this.projectModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            ...(dto.title !== undefined && { title: dto.title }),
            ...(dto.description !== undefined && { description: dto.description }),
            ...(dto.sectionDescriptions !== undefined && {
              sectionDescriptions: dto.sectionDescriptions,
            }),
          },
        },
        { new: true },
      )
      .lean()
      .exec();
    if (!doc) throw new NotFoundException('Projet introuvable');
    return doc;
  }

  async createVersion(projectId: string, dto: CreateDeckLandingVersionDto) {
    if (!Types.ObjectId.isValid(projectId)) {
      throw new NotFoundException('Identifiant projet invalide');
    }
    const proj = await this.projectModel.findById(projectId).exec();
    if (!proj) throw new NotFoundException('Projet introuvable');

    const last = await this.versionModel
      .findOne({ projectId: proj._id })
      .sort({ versionNumber: -1 })
      .exec();
    const nextNum = (last?.versionNumber ?? 0) + 1;
    const status = dto.status ?? 'draft';

    const v = await this.versionModel.create({
      projectId: proj._id,
      versionNumber: nextNum,
      status,
      label: dto.label,
      sectionOrder: dto.sectionOrder ?? [],
      variantsBySection: dto.variantsBySection ?? {},
      content: dto.content,
      ...(dto.buildOptions !== undefined ? { buildOptions: dto.buildOptions } : {}),
    });

    if (status === 'draft') {
      proj.currentDraftVersionId = v._id as Types.ObjectId;
      await proj.save();
    }
    if (status === 'published') {
      proj.publishedVersionId = v._id as Types.ObjectId;
      await proj.save();
    }

    return v.toJSON();
  }

  async listVersions(projectId: string) {
    if (!Types.ObjectId.isValid(projectId)) {
      throw new NotFoundException('Identifiant projet invalide');
    }
    const proj = await this.projectModel.findById(projectId).lean().exec();
    if (!proj) throw new NotFoundException('Projet introuvable');
    return this.versionModel
      .find({ projectId: new Types.ObjectId(projectId) })
      .sort({ versionNumber: -1 })
      .lean()
      .exec();
  }

  async getVersion(versionId: string) {
    if (!Types.ObjectId.isValid(versionId)) {
      throw new NotFoundException('Identifiant version invalide');
    }
    const v = await this.versionModel.findById(versionId).lean().exec();
    if (!v) throw new NotFoundException('Version introuvable');
    return v;
  }

  /** Vérifie que la version appartient au projet. */
  async assertVersionBelongsToProject(projectId: string, versionId: string) {
    const v = await this.getVersion(versionId);
    const pid = String(v.projectId);
    if (pid !== projectId) {
      throw new BadRequestException('Cette version n’appartient pas à ce projet');
    }
    return v;
  }

  async updateVersion(versionId: string, dto: UpdateDeckLandingVersionDto) {
    if (!Types.ObjectId.isValid(versionId)) {
      throw new NotFoundException('Identifiant version invalide');
    }
    const v = await this.versionModel.findById(versionId).exec();
    if (!v) throw new NotFoundException('Version introuvable');

    const proj = await this.projectModel.findById(v.projectId).lean().exec();
    if (!proj) throw new NotFoundException('Projet introuvable');

    if (dto.label !== undefined) {
      v.label = dto.label;
    }
    if (dto.sectionOrder !== undefined) {
      v.sectionOrder = dto.sectionOrder;
    }
    if (dto.variantsBySection !== undefined) {
      v.variantsBySection = dto.variantsBySection;
    }
    if (dto.buildOptions !== undefined) {
      v.set('buildOptions', dto.buildOptions);
    }

    const order = v.sectionOrder;
    const variants = v.variantsBySection as Record<string, string>;
    const complete =
      order.length > 0 && order.every((id) => typeof variants[id] === 'string' && variants[id].length > 0);

    const rebuild =
      complete &&
      (dto.rebuildContentSections !== false) &&
      (dto.sectionOrder !== undefined || dto.variantsBySection !== undefined);

    if (complete) {
      this.structureWizard.validateStructure(order, variants);
    }

    if (rebuild) {
      const prev = v.content as Record<string, unknown>;
      const slug = typeof prev.slug === 'string' && prev.slug ? prev.slug : proj.slug;
      v.content = {
        ...prev,
        version: typeof prev.version === 'number' ? prev.version : 1,
        slug,
        sections: this.structureWizard.buildContentSections(order, variants, slug),
      } as Record<string, unknown>;
    }

    await v.save();
    return v.toJSON();
  }

  /** Fusionne le document landing généré par Grok dans la version (conserve `imageHistory` si présent). */
  async mergePopulatedLandingDocument(
    versionId: string,
    doc: Record<string, unknown>,
  ): Promise<unknown> {
    if (!Types.ObjectId.isValid(versionId)) {
      throw new NotFoundException('Identifiant version invalide');
    }
    const v = await this.versionModel.findById(versionId).exec();
    if (!v) throw new NotFoundException('Version introuvable');

    const prev = v.content as Record<string, unknown>;
    const merged: Record<string, unknown> = { ...doc };
    if (merged.imageHistory === undefined && prev.imageHistory !== undefined) {
      merged.imageHistory = prev.imageHistory;
    }
    v.content = merged;
    await v.save();
    return v.toJSON() as unknown;
  }

  /** Fusionne des champs dans `content.globals` (préserve le reste du document). */
  async patchContentGlobals(
    versionId: string,
    dto: PatchDeckLandingContentGlobalsDto,
  ): Promise<unknown> {
    if (!Types.ObjectId.isValid(versionId)) {
      throw new NotFoundException('Identifiant version invalide');
    }
    const v = await this.versionModel.findById(versionId).exec();
    if (!v) throw new NotFoundException('Version introuvable');

    if (dto.visualBrief === undefined && dto.visualBriefMarkdown === undefined) {
      throw new BadRequestException('Fournis au moins visualBrief ou visualBriefMarkdown');
    }

    const content = JSON.parse(JSON.stringify(v.content ?? {})) as Record<string, unknown>;
    const prevG = content.globals && typeof content.globals === 'object' && !Array.isArray(content.globals)
      ? { ...(content.globals as Record<string, unknown>) }
      : {};

    if (dto.visualBrief !== undefined) {
      const t = dto.visualBrief.trim();
      if (t) {
        prevG.visualBrief = t;
      } else {
        delete prevG.visualBrief;
      }
    }
    if (dto.visualBriefMarkdown !== undefined) {
      const t = dto.visualBriefMarkdown.trim();
      if (t) {
        prevG.visualBriefMarkdown = t;
      } else {
        delete prevG.visualBriefMarkdown;
      }
    }
    content.globals = prevG;
    v.content = content;
    await v.save();
    return v.toJSON() as unknown;
  }

  /**
   * Met à jour un slot `imageSlots` (et synchronise `media` / `props` pour les URLs).
   */
  async patchContentImageSlot(versionId: string, dto: PatchDeckLandingImageSlotDto): Promise<unknown> {
    if (!Types.ObjectId.isValid(versionId)) {
      throw new NotFoundException('Identifiant version invalide');
    }
    const v = await this.versionModel.findById(versionId).exec();
    if (!v) throw new NotFoundException('Version introuvable');

    if (
      dto.resolved === undefined &&
      dto.sceneDescription === undefined &&
      dto.imageAlt === undefined &&
      dto.primaryModel === undefined
    ) {
      throw new BadRequestException(
        'Fournis au moins resolved, sceneDescription, imageAlt ou primaryModel',
      );
    }

    const content = JSON.parse(JSON.stringify(v.content ?? {})) as Record<string, unknown>;
    normalizeImageSlotsInLandingDoc(content);

    const sections = content.sections;
    if (!Array.isArray(sections)) {
      throw new BadRequestException('content.sections manquant');
    }

    const sec = sections.find((s) => isRecord(s) && s.id === dto.sectionId);
    if (!sec || !isRecord(sec)) {
      throw new BadRequestException(`Section inconnue : ${dto.sectionId}`);
    }

    const variant = typeof sec.variant === 'string' ? sec.variant : '';
    const slots = Array.isArray(sec.imageSlots) ? sec.imageSlots : [];
    const slotIdx = slots.findIndex(
      (x) => isRecord(x) && (x as { slotId?: string }).slotId === dto.slotId,
    );
    if (slotIdx < 0) {
      throw new BadRequestException(
        `Slot inconnu : ${dto.sectionId} / ${dto.slotId} (remplis le contenu ou vérifie les ids)`,
      );
    }

    const slotDef = slots[slotIdx] as Record<string, unknown>;

    if (dto.primaryModel !== undefined) {
      const prevGen =
        slotDef.generation && typeof slotDef.generation === 'object' && !Array.isArray(slotDef.generation)
          ? { ...(slotDef.generation as Record<string, unknown>) }
          : {};
      slotDef.generation = { ...prevGen, primaryModel: dto.primaryModel };
    }

    if (dto.sceneDescription !== undefined) {
      const sd = dto.sceneDescription.trim();
      if (!sd) {
        throw new BadRequestException('sceneDescription ne peut pas être vide');
      }
      slotDef.sceneDescription = sd;
      const media = Array.isArray(sec.media) ? sec.media : [];
      for (const m of media) {
        if (isRecord(m) && m.slotId === dto.slotId) {
          m.sceneDescription = sd;
          break;
        }
      }
    }

    if (dto.resolved) {
      const url = dto.resolved.imageUrl.trim();
      if (!url) {
        throw new BadRequestException('resolved.imageUrl vide');
      }

      const mediaList = Array.isArray(sec.media) ? sec.media : [];
      const fromMedia = mediaList.find(
        (m): m is Record<string, unknown> => isRecord(m) && m.slotId === dto.slotId,
      );

      const scene =
        typeof slotDef.sceneDescription === 'string' && slotDef.sceneDescription.trim()
          ? slotDef.sceneDescription.trim()
          : typeof fromMedia?.sceneDescription === 'string' && String(fromMedia.sceneDescription).trim()
            ? String(fromMedia.sceneDescription).trim()
            : ' ';

      const mediaSlot: DeckSectionMediaSlotV1 = {
        slotId: dto.slotId,
        aspectRatio:
          typeof fromMedia?.aspectRatio === 'string' && fromMedia.aspectRatio.trim()
            ? fromMedia.aspectRatio.trim()
            : typeof slotDef.aspectRatio === 'string' && String(slotDef.aspectRatio).trim()
              ? String(slotDef.aspectRatio).trim()
              : '16:9',
        sceneDescription: scene,
        ...(typeof fromMedia?.mood === 'string' ? { mood: fromMedia.mood } : {}),
        ...(typeof fromMedia?.styleVisual === 'string' ? { styleVisual: fromMedia.styleVisual } : {}),
        ...(typeof fromMedia?.colorContext === 'string' ? { colorContext: fromMedia.colorContext } : {}),
        ...(typeof fromMedia?.constraints === 'string' ? { constraints: fromMedia.constraints } : {}),
        ...(typeof slotDef.altHintFr === 'string'
          ? { altHintFr: slotDef.altHintFr }
          : typeof fromMedia?.altHintFr === 'string'
            ? { altHintFr: fromMedia.altHintFr as string }
            : {}),
      };

      const applied = applySlotImageUrlToSectionContent(sec, dto.sectionId, variant, mediaSlot, url);
      if (!applied) {
        throw new BadRequestException(
          `Impossible d’appliquer l’image pour ${dto.sectionId}/${dto.slotId} (variante ou emplacement JSON non pris en charge)`,
        );
      }

      const alt = dto.resolved.imageAlt?.trim();
      slotDef.resolved = {
        imageUrl: url,
        ...(alt ? { imageAlt: alt } : {}),
        source: dto.resolved.source ?? 'upload',
      };

      appendLandingImageHistory(content, dto.sectionId, dto.slotId, {
        id: randomUUID(),
        imageUrl: url,
        prompt: '(assignation manuelle)',
        model: dto.resolved.source === 'external' ? 'external' : 'upload',
        createdAt: new Date().toISOString(),
      });
    }

    if (dto.imageAlt !== undefined) {
      const alt = dto.imageAlt.trim();
      const prevRes =
        slotDef.resolved && typeof slotDef.resolved === 'object' && !Array.isArray(slotDef.resolved)
          ? (slotDef.resolved as Record<string, unknown>)
          : {};
      const existingUrl = typeof prevRes.imageUrl === 'string' ? prevRes.imageUrl.trim() : '';
      slotDef.resolved = { ...prevRes, ...(alt ? { imageAlt: alt } : {}) };
      if (!alt) {
        delete (slotDef.resolved as Record<string, unknown>).imageAlt;
      }
      if (existingUrl) {
        const mediaList = Array.isArray(sec.media) ? sec.media : [];
        const fromMedia = mediaList.find(
          (m): m is Record<string, unknown> => isRecord(m) && m.slotId === dto.slotId,
        );
        const scene =
          typeof slotDef.sceneDescription === 'string' && slotDef.sceneDescription.trim()
            ? slotDef.sceneDescription.trim()
            : typeof fromMedia?.sceneDescription === 'string' && String(fromMedia.sceneDescription).trim()
              ? String(fromMedia.sceneDescription).trim()
              : ' ';
        const mediaSlot: DeckSectionMediaSlotV1 = {
          slotId: dto.slotId,
          aspectRatio:
            typeof fromMedia?.aspectRatio === 'string' && fromMedia.aspectRatio.trim()
              ? fromMedia.aspectRatio.trim()
              : typeof slotDef.aspectRatio === 'string' && String(slotDef.aspectRatio).trim()
                ? String(slotDef.aspectRatio).trim()
                : '16:9',
          sceneDescription: scene,
          ...(alt ? { altHintFr: alt } : {}),
          ...(typeof fromMedia?.mood === 'string' ? { mood: fromMedia.mood } : {}),
          ...(typeof fromMedia?.styleVisual === 'string' ? { styleVisual: fromMedia.styleVisual } : {}),
          ...(typeof fromMedia?.colorContext === 'string' ? { colorContext: fromMedia.colorContext } : {}),
          ...(typeof fromMedia?.constraints === 'string' ? { constraints: fromMedia.constraints } : {}),
        };
        const applied = applySlotImageUrlToSectionContent(sec, dto.sectionId, variant, mediaSlot, existingUrl);
        if (!applied) {
          throw new BadRequestException(
            `Impossible d’appliquer le texte alternatif pour ${dto.sectionId}/${dto.slotId}`,
          );
        }
      }
    }

    v.content = content;
    await v.save();
    return v.toJSON() as unknown;
  }

  /** Remplace entièrement `content` (objet déjà cloné / muté côté appelant). */
  async persistVersionContent(versionId: string, content: Record<string, unknown>): Promise<unknown> {
    if (!Types.ObjectId.isValid(versionId)) {
      throw new NotFoundException('Identifiant version invalide');
    }
    const v = await this.versionModel.findById(versionId).exec();
    if (!v) throw new NotFoundException('Version introuvable');
    v.content = content;
    await v.save();
    return v.toJSON() as unknown;
  }
}
