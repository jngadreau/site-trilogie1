import { ConfigService } from '@nestjs/config';

/** Compatible avec la logique `jng-fwk` / Redis classique. */
export function getBullConnectionOptions(config: ConfigService): {
  host: string;
  port: number;
  password?: string;
} {
  const url = config.get<string>('REDIS_URL')?.trim();
  if (url) {
    try {
      const u = new URL(url);
      return {
        host: u.hostname,
        port: parseInt(u.port || '6379', 10),
        password: u.password || undefined,
      };
    } catch {
      /* fallback */
    }
  }
  return {
    host: config.get<string>('REDIS_HOST') ?? 'localhost',
    port: parseInt(config.get<string>('REDIS_PORT') ?? '6379', 10),
    password: config.get<string>('REDIS_PASSWORD') || undefined,
  };
}
