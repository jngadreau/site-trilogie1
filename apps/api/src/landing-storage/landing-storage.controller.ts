import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
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
import { DeckLandingStorageService } from './deck-landing-storage.service';
import { LandingContentPopulateService } from './landing-content-populate.service';
import { LandingStructureWizardService } from './landing-structure-wizard.service';
import { S3AssetsService } from './s3-assets.service';
import { LandingVersionHeroS3Service } from './landing-version-hero-s3.service';

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

@Controller('site/landing-storage')
export class LandingStorageController {
  constructor(
    private readonly storage: DeckLandingStorageService,
    private readonly s3: S3AssetsService,
    private readonly structureWizard: LandingStructureWizardService,
    private readonly contentPopulate: LandingContentPopulateService,
    private readonly heroS3: LandingVersionHeroS3Service,
  ) {}

  /** Santé connexion Mongo + présence config S3 (clés présentes). */
  @Get('status')
  status() {
    return {
      mongo: this.storage.mongoConnected(),
      mongoReadyState: this.storage.getMongoReadyState(),
      s3: this.s3.isReady(),
      s3Bucket: this.s3.isReady() ? this.s3.getBucket() : null,
      storageEnvId: this.s3.storageEnvId(),
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
   * Grok : remplit `globals`, `imagePrompts`, `sections` (props + media) selon la structure déjà enregistrée sur la version.
   */
  /**
   * Grok Imagine → fichier local → upload S3 → mise à jour `hero.props.imageUrl`, `imagePrompts.hero`, `imageHistory.hero`.
   */
  @Post('projects/:projectId/versions/:versionId/generate-hero-s3')
  async generateHeroS3(
    @Param('projectId') projectId: string,
    @Param('versionId') versionId: string,
  ) {
    return this.heroS3.generateHeroToS3(projectId, versionId);
  }

  @Post('projects/:projectId/versions/:versionId/populate-content')
  async populateContent(
    @Param('projectId') projectId: string,
    @Param('versionId') versionId: string,
    @Body() dto: PopulateDeckLandingVersionDto,
  ) {
    await this.storage.assertVersionBelongsToProject(projectId, versionId);
    return this.contentPopulate.populateVersionContent(projectId, versionId, dto?.brief);
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
    const signedUrl = await this.s3.getSignedGetUrl(key, 3600);
    return { key, contentType, signedGetUrl: signedUrl, expiresInSeconds: 3600 };
  }
}
