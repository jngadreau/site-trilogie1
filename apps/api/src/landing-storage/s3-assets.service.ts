import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import type { Readable } from 'node:stream';
import * as path from 'path';

/**
 * Stockage objet aligné sur gnova-cv-app : même bucket, endpoint OVH, ENV_ID_FOR_STORAGE.
 * Préfixe objet : `<S3_STORAGE_KEY_PREFIX ou "cvapp">/<ENV_ID_FOR_STORAGE>/deck-landings/...`
 * La webapp ne voit que des URLs relatives API (`buildPublicAssetUrlPath`), pas S3.
 */
@Injectable()
export class S3AssetsService {
  private readonly logger = new Logger(S3AssetsService.name);
  private readonly client: S3Client | null;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    const accessKeyId = this.config.get<string>('S3_ACCESS_KEY_ID')?.trim();
    const secretAccessKey = this.config.get<string>('S3_SECRET_ACCESS_KEY')?.trim();
    this.bucket = this.config.get<string>('S3_BUCKET_NAME')?.trim() ?? '';
    const region = this.config.get<string>('S3_REGION')?.trim() ?? 'gra';
    const endpoint = this.config.get<string>('S3_ENDPOINT')?.trim();
    const forcePathStyle =
      this.config.get<string>('S3_FORCE_PATH_STYLE') === 'true' ||
      this.config.get<string>('S3_FORCE_PATH_STYLE') === '1';

    if (!accessKeyId || !secretAccessKey || !this.bucket || !endpoint) {
      this.logger.warn('S3 non configuré (S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_BUCKET_NAME, S3_ENDPOINT).');
      this.client = null;
      return;
    }

    this.client = new S3Client({
      region,
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle,
    });
    this.logger.log(`S3 prêt — bucket=${this.bucket} region=${region}`);
  }

  isReady(): boolean {
    return this.client !== null;
  }

  getBucket(): string {
    return this.bucket;
  }

  storageEnvId(): string {
    return this.config.get<string>('ENV_ID_FOR_STORAGE')?.trim() || 'dev';
  }

  /** Premier segment de la clé S3 (défaut `cvapp`, surchargé par `S3_STORAGE_KEY_PREFIX`). */
  storageKeyPrefix(): string {
    return this.config.get<string>('S3_STORAGE_KEY_PREFIX')?.trim() || 'cvapp';
  }

  /**
   * URL **path** servie par l’API (proxy Vite `/site/...`) — à persister dans le JSON landing à la place des URLs S3.
   */
  buildPublicAssetUrlPath(projectId: string, versionId: string, assetFileName: string): string {
    return `/site/landing-storage/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(versionId)}/assets/file/${encodeURIComponent(assetFileName)}`;
  }

  /**
   * Reconstruit la clé S3 à partir du nom de fichier (basename) déjà stocké sous `.../assets/`.
   */
  buildDeckLandingAssetKeyFromFileName(
    projectId: string,
    versionId: string,
    assetFileName: string,
  ): string {
    const safe = path.basename(assetFileName);
    if (!/^[\w.-]+\.(png|jpe?g|webp|gif|bin)$/i.test(safe)) {
      throw new Error(`Nom de fichier asset invalide: ${safe}`);
    }
    const envId = this.storageEnvId();
    const prefix = this.storageKeyPrefix();
    return `${prefix}/${envId}/deck-landings/${projectId}/${versionId}/assets/${safe}`;
  }

  /**
   * Clé objet complète (interne).
   */
  buildDeckLandingAssetKey(projectId: string, versionId: string, originalName: string): string {
    const envId = this.storageEnvId();
    const prefix = this.storageKeyPrefix();
    const ext = path.extname(originalName) || '.bin';
    const base = path.basename(originalName, ext).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
    const unique = randomBytes(6).toString('hex');
    const fileName = `${base}-${unique}${ext}`;
    return `${prefix}/${envId}/deck-landings/${projectId}/${versionId}/assets/${fileName}`;
  }

  async putObject(key: string, body: Buffer, contentType: string): Promise<void> {
    if (!this.client) {
      throw new Error('S3 non configuré');
    }
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
  }

  async getSignedGetUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    if (!this.client) {
      throw new Error('S3 non configuré');
    }
    const cmd = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.client, cmd, { expiresIn: expiresInSeconds });
  }

  /** Stream objet (pour GET API sans exposer S3 au client). */
  async getObjectStream(
    key: string,
  ): Promise<{ stream: Readable; contentType: string; contentLength?: number }> {
    if (!this.client) {
      throw new Error('S3 non configuré');
    }
    const out = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    const body = out.Body;
    if (!body) {
      throw new Error('S3 GetObject : corps vide');
    }
    const contentType = out.ContentType?.split(';')[0]?.trim() || 'application/octet-stream';
    const len = out.ContentLength;
    return {
      stream: body as Readable,
      contentType,
      ...(typeof len === 'number' ? { contentLength: len } : {}),
    };
  }
}
