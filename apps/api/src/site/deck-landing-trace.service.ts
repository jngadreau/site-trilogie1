import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { getBullConnectionOptions } from '../config/bullmq.config';

const TTL_SEC = 86_400;

@Injectable()
export class DeckLandingTraceService implements OnModuleDestroy {
  private readonly logger = new Logger(DeckLandingTraceService.name);
  private readonly redis: Redis;

  constructor(config: ConfigService) {
    this.redis = new Redis({
      ...getBullConnectionOptions(config),
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }

  private k(traceId: string, suffix: string): string {
    return `dl:t:${traceId}:${suffix}`;
  }

  async initTrace(
    traceId: string,
    payload: {
      slug: string;
      globalsJson: string;
      variantsJson: string;
      imagePromptsJson: string;
      expectedSections: number;
    },
  ): Promise<void> {
    const pipe = this.redis.pipeline();
    pipe.set(this.k(traceId, 'slug'), payload.slug, 'EX', TTL_SEC);
    pipe.set(this.k(traceId, 'globals'), payload.globalsJson, 'EX', TTL_SEC);
    pipe.set(this.k(traceId, 'variants'), payload.variantsJson, 'EX', TTL_SEC);
    pipe.set(this.k(traceId, 'imagePrompts'), payload.imagePromptsJson, 'EX', TTL_SEC);
    pipe.set(this.k(traceId, 'expected'), String(payload.expectedSections), 'EX', TTL_SEC);
    pipe.set(this.k(traceId, 'done'), '0', 'EX', TTL_SEC);
    await pipe.exec();
  }

  async setSectionPayload(traceId: string, sectionId: string, json: string): Promise<void> {
    await this.redis.set(this.k(traceId, `section:${sectionId}`), json, 'EX', TTL_SEC);
  }

  /** Incrémente le compteur ; retourne la nouvelle valeur. */
  async incrDone(traceId: string): Promise<number> {
    return this.redis.incr(this.k(traceId, 'done'));
  }

  async getExpected(traceId: string): Promise<number> {
    const v = await this.redis.get(this.k(traceId, 'expected'));
    return v ? parseInt(v, 10) : 0;
  }

  async getSlug(traceId: string): Promise<string | null> {
    return this.redis.get(this.k(traceId, 'slug'));
  }

  async getGlobals(traceId: string): Promise<string | null> {
    return this.redis.get(this.k(traceId, 'globals'));
  }

  async getVariants(traceId: string): Promise<string | null> {
    return this.redis.get(this.k(traceId, 'variants'));
  }

  async getImagePrompts(traceId: string): Promise<string | null> {
    return this.redis.get(this.k(traceId, 'imagePrompts'));
  }

  async getSectionPayload(traceId: string, sectionId: string): Promise<string | null> {
    return this.redis.get(this.k(traceId, `section:${sectionId}`));
  }

  async deleteTrace(traceId: string, sectionIds: readonly string[]): Promise<void> {
    const keys = [
      this.k(traceId, 'slug'),
      this.k(traceId, 'globals'),
      this.k(traceId, 'variants'),
      this.k(traceId, 'imagePrompts'),
      this.k(traceId, 'expected'),
      this.k(traceId, 'done'),
      ...sectionIds.map((id) => this.k(traceId, `section:${id}`)),
    ];
    if (keys.length) await this.redis.del(...keys);
  }

  /**
   * Verrou simple pour lectures/écritures concurrentes sur le JSON landing (images).
   */
  async withLandingFileLock<T>(slug: string, fn: () => Promise<T>): Promise<T> {
    const key = `dl:lock:${slug}`;
    const maxAttempts = 40;
    for (let i = 0; i < maxAttempts; i++) {
      const ok = await this.redis.set(key, '1', 'EX', 60, 'NX');
      if (ok === 'OK') {
        try {
          return await fn();
        } finally {
          await this.redis.del(key).catch(() => undefined);
        }
      }
      await new Promise((r) => setTimeout(r, 150));
    }
    this.logger.error(`Timeout verrou landing ${slug}`);
    throw new Error(`Impossible d'obtenir le verrou pour ${slug}`);
  }
}
