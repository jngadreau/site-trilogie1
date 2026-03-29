import {
  BadRequestException,
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateDeckLandingProjectDto } from './dto/create-deck-landing-project.dto';
import { CreateDeckLandingVersionDto } from './dto/create-deck-landing-version.dto';
import { SuggestLandingStructureDto } from './dto/suggest-landing-structure.dto';
import { UpdateDeckLandingProjectDto } from './dto/update-deck-landing-project.dto';
import { UpdateDeckLandingVersionDto } from './dto/update-deck-landing-version.dto';
import { PopulateDeckLandingVersionDto } from './dto/populate-deck-landing-version.dto';
import { PatchDeckLandingContentGlobalsDto } from './dto/patch-deck-landing-content-globals.dto';
import { PatchDeckLandingImageSlotDto } from './dto/patch-deck-landing-image-slot.dto';
import { SuggestPromptAlternativesDto } from './dto/suggest-prompt-alternatives.dto';
import { DeckLandingStorageService } from './deck-landing-storage.service';
import { LandingContentPopulateService } from './landing-content-populate.service';
import { LandingStructureWizardService } from './landing-structure-wizard.service';
import { S3AssetsService } from './s3-assets.service';
import { LandingVersionMediaS3Service } from './landing-version-media-s3.service';
import { LandingImageSlotPromptsService } from './landing-image-slot-prompts.service';
import * as path from 'path';

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

@Controller('site/landing-storage')
export class LandingStorageController {
  private readonly logger = new Logger(LandingStorageController.name);

  constructor(
    private readonly storage: DeckLandingStorageService,
    private readonly s3: S3AssetsService,
    private readonly structureWizard: LandingStructureWizardService,
    private readonly contentPopulate: LandingContentPopulateService,
    private readonly mediaS3: LandingVersionMediaS3Service,
    private readonly slotPrompts: LandingImageSlotPromptsService,
  ) {}

  /** Santé connexion Mongo + présence config stockage (sans exposer le bucket ni les clés S3). */
  @Get('status')
  status() {
    return {
      mongo: this.storage.mongoConnected(),
      mongoReadyState: this.storage.getMongoReadyState(),
      storageReady: this.s3.isReady(),
    };
  }

  @Post('projects')
  async createProject(@Body() dto: CreateDeckLandingProjectDto) {
    return this.storage.createProject(dto);
  }

  @Get('projects')
  async listProjects(@Query('gameKey') gameKey?: string) {
    return this.storage.listProjects(gameKey?.trim() || undefined);
  }

  @Get('projects/:projectId')
  async getProject(@Param('projectId') projectId: string) {
    return this.storage.getProject(projectId);
  }

  @Patch('projects/:projectId')
  async updateProject(
    @Param('projectId') projectId: string,
    @Body() dto: UpdateDeckLandingProjectDto,
  ) {
    return this.storage.updateProject(projectId, dto);
  }

  @Post('projects/:projectId/versions')
  async createVersion(
    @Param('projectId') projectId: string,
    @Body() dto: CreateDeckLandingVersionDto,
  ) {
    return this.storage.createVersion(projectId, dto);
  }

  @Get('projects/:projectId/versions')
  async listVersions(@Param('projectId') projectId: string) {
    return this.storage.listVersions(projectId);
  }

  @Get('versions/:versionId')
  async getVersion(@Param('versionId') versionId: string) {
    return this.storage.getVersion(versionId);
  }

  /**
   * Sert un fichier binaire stocké pour la version — **seule** URL que la webapp met dans `imageUrl`
   * (pas d’URL S3 ni de signature exposées au client).
   */
  @Get('projects/:projectId/versions/:versionId/assets/file/:fileName')
  async getVersionAssetFile(
    @Param('projectId') projectId: string,
    @Param('versionId') versionId: string,
    @Param('fileName') fileName: string,
  ): Promise<StreamableFile> {
    await this.storage.assertVersionBelongsToProject(projectId, versionId);
    if (!this.s3.isReady()) {
      throw new BadRequestException('Stockage fichiers non configuré');
    }
    const base = path.basename(fileName);
    if (!/^[\w.-]+\.(png|jpe?g|webp|gif|bin)$/i.test(base)) {
      throw new BadRequestException('Nom de fichier non autorisé');
    }
    let key: string;
    try {
      key = this.s3.buildDeckLandingAssetKeyFromFileName(projectId, versionId, base);
    } catch {
      throw new BadRequestException('Nom de fichier invalide');
    }
    try {
      const { stream, contentType, contentLength } = await this.s3.getObjectStream(key);
      return new StreamableFile(stream, {
        type: contentType,
        disposition: `inline; filename="${base.replace(/"/g, '')}"`,
        ...(typeof contentLength === 'number' ? { length: contentLength } : {}),
      });
    } catch (e: unknown) {
      const code = (e as { Code?: string; name?: string }).Code ?? (e as { name?: string }).name;
      const status = (e as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
      if (code === 'NoSuchKey' || status === 404) {
        throw new NotFoundException('Fichier introuvable');
      }
      this.logger.warn(`getVersionAssetFile ${key}: ${e instanceof Error ? e.message : String(e)}`);
      throw new InternalServerErrorException('Lecture du fichier impossible');
    }
  }

  @Patch('projects/:projectId/versions/:versionId')
  async patchVersion(
    @Param('projectId') projectId: string,
    @Param('versionId') versionId: string,
    @Body() dto: UpdateDeckLandingVersionDto,
  ) {
    await this.storage.assertVersionBelongsToProject(projectId, versionId);
    return this.storage.updateVersion(versionId, dto);
  }

  /**
   * Met à jour un slot image (`imageSlots` + sync `media` / `props`). Body : `sectionId`, `slotId`, et
   * `resolved` (après `POST …/assets`) et/ou `sceneDescription`.
   */
  @Patch('projects/:projectId/versions/:versionId/image-slot')
  async patchImageSlot(
    @Param('projectId') projectId: string,
    @Param('versionId') versionId: string,
    @Body() dto: PatchDeckLandingImageSlotDto,
  ) {
    await this.storage.assertVersionBelongsToProject(projectId, versionId);
    return this.storage.patchContentImageSlot(versionId, dto);
  }

  /** Met à jour `content.globals` : `visualBrief`, `visualBriefMarkdown`, `backgroundImage`, `clearBackgroundImage`. */
  @Patch('projects/:projectId/versions/:versionId/content-globals')
  async patchContentGlobals(
    @Param('projectId') projectId: string,
    @Param('versionId') versionId: string,
    @Body() dto: PatchDeckLandingContentGlobalsDto,
  ) {
    await this.storage.assertVersionBelongsToProject(projectId, versionId);
    return this.storage.patchContentGlobals(versionId, dto);
  }

  /**
   * Prompt Imagine assemblé (EN) + ratio — pour copie manuelle (ex. Midjourney). Query : `sectionId`, `slotId`.
   */
  @Get('projects/:projectId/versions/:versionId/assembled-image-prompt')
  async getAssembledImagePrompt(
    @Param('projectId') projectId: string,
    @Param('versionId') versionId: string,
    @Query('sectionId') sectionId: string,
    @Query('slotId') slotId: string,
  ) {
    await this.storage.assertVersionBelongsToProject(projectId, versionId);
    const sid = sectionId?.trim();
    const sl = slotId?.trim();
    if (!sid || !sl) {
      throw new BadRequestException('Query sectionId et slotId requis');
    }
    return this.slotPrompts.getAssembledImaginePrompt(projectId, versionId, sid, sl);
  }

  /**
   * Grok : variantes de prompts EN pour un slot ; persiste `generation.promptAlternativesEn`.
   * Body : `sectionId`, `slotId`, `count?` (5–12, défaut 6).
   */
  @Post('projects/:projectId/versions/:versionId/suggest-prompt-alternatives')
  async suggestPromptAlternatives(
    @Param('projectId') projectId: string,
    @Param('versionId') versionId: string,
    @Body() dto: SuggestPromptAlternativesDto,
  ) {
    await this.storage.assertVersionBelongsToProject(projectId, versionId);
    return this.slotPrompts.suggestPromptAlternatives(projectId, versionId, {
      sectionId: dto.sectionId,
      slotId: dto.slotId,
      count: dto.count,
    });
  }

  /**
   * Grok : propose sectionOrder + variants (sous-ensemble, ordre libre). Ne persiste pas.
   */
  @Post('projects/:projectId/versions/:versionId/suggest-structure')
  async suggestStructure(
    @Param('projectId') projectId: string,
    @Param('versionId') versionId: string,
    @Body() dto: SuggestLandingStructureDto,
  ) {
    await this.storage.assertVersionBelongsToProject(projectId, versionId);
    const proj = await this.storage.getProject(projectId);
    return this.structureWizard.suggestStructureAuto({
      gameKey: proj.gameKey,
      projectSlug: proj.slug,
      brief: dto?.brief,
    });
  }

  /**
   * Tous les slots `media` avec `sceneDescription` : Imagine → stockage → props (hero = même flux, repli `imagePrompts.hero`).
   */
  @Post('projects/:projectId/versions/:versionId/generate-all-imagine-s3')
  async generateAllImagineS3(
    @Param('projectId') projectId: string,
    @Param('versionId') versionId: string,
  ) {
    return this.mediaS3.generateAllImagineMediaToS3(projectId, versionId);
  }

  /**
   * Remplace les `imageUrl` déjà présents (chemins API locaux, `/images/`, http(s)) par des objets S3 + URL signée.
   */
  @Post('projects/:projectId/versions/:versionId/hydrate-image-urls-s3')
  async hydrateImageUrlsS3(
    @Param('projectId') projectId: string,
    @Param('versionId') versionId: string,
  ) {
    return this.mediaS3.hydrateImageUrlsToS3(projectId, versionId);
  }

  /**
   * Grok : remplit `globals`, `imagePrompts`, `sections` (props + media) selon la structure déjà enregistrée sur la version.
   */
  @Post('projects/:projectId/versions/:versionId/populate-content')
  async populateContent(
    @Param('projectId') projectId: string,
    @Param('versionId') versionId: string,
    @Body() dto: PopulateDeckLandingVersionDto,
  ) {
    await this.storage.assertVersionBelongsToProject(projectId, versionId);
    return this.contentPopulate.populateVersionContent(projectId, versionId, {
      brief: dto?.brief,
      skipAutoImagine: dto?.skipAutoImagine,
    });
  }

  @Post('projects/:projectId/versions/:versionId/assets')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_BYTES } }))
  async uploadAsset(
    @Param('projectId') projectId: string,
    @Param('versionId') versionId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    if (!this.s3.isReady()) {
      throw new BadRequestException('S3 non configuré');
    }
    if (!file?.buffer?.length) {
      throw new BadRequestException('Fichier manquant (champ form `file`)');
    }
    await this.storage.getProject(projectId);
    await this.storage.getVersion(versionId);
    const key = this.s3.buildDeckLandingAssetKey(projectId, versionId, file.originalname);
    const contentType = file.mimetype || 'application/octet-stream';
    await this.s3.putObject(key, file.buffer, contentType);
    const assetFileName = key.split('/').pop() ?? path.basename(file.originalname);
    const publicUrl = this.s3.buildPublicAssetUrlPath(projectId, versionId, assetFileName);
    return { publicUrl, contentType, fileName: assetFileName };
  }
}
