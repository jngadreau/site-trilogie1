import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import type { CreateDeckLandingProjectDto } from './dto/create-deck-landing-project.dto';
import type { CreateDeckLandingVersionDto } from './dto/create-deck-landing-version.dto';
import type { UpdateDeckLandingProjectDto } from './dto/update-deck-landing-project.dto';
import {
  DeckLandingProject,
  type DeckLandingProjectDocument,
} from './schemas/deck-landing-project.schema';
import {
  DeckLandingVersion,
  type DeckLandingVersionDocument,
} from './schemas/deck-landing-version.schema';

@Injectable()
export class DeckLandingStorageService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(DeckLandingProject.name)
    private readonly projectModel: Model<DeckLandingProjectDocument>,
    @InjectModel(DeckLandingVersion.name)
    private readonly versionModel: Model<DeckLandingVersionDocument>,
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
}
