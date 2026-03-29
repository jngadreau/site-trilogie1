import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import * as path from 'path';

/**
 * Stockage objet aligné sur gnova-cv-app : même bucket, endpoint OVH, ENV_ID_FOR_STORAGE.
 * Préfixe : `cvapp/<ENV_ID_FOR_STORAGE>/deck-landings/...`
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

  /**
   * Clé objet complète (à stocker en base si besoin).
   */
  buildDeckLandingAssetKey(projectId: string, versionId: string, originalName: string): string {
    const envId = this.storageEnvId();
    const ext = path.extname(originalName) || '.bin';
    const base = path.basename(originalName, ext).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
    const unique = randomBytes(6).toString('hex');
    const fileName = `${base}-${unique}${ext}`;
    return `cvapp/${envId}/deck-landings/${projectId}/${versionId}/assets/${fileName}`;
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
}
