import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import * as path from 'path';
import sharp from 'sharp';
import { CardsService } from '../cards/cards.service';
import { getGeneratedImagesDir } from '../paths';

export interface ComposeFanInput {
  files: string[];
  outputSlug?: string;
}

@Injectable()
export class CardFanService {
  private readonly logger = new Logger(CardFanService.name);

  constructor(private readonly cards: CardsService) {}

  async composeFan(input: ComposeFanInput): Promise<{ path: string }> {
    const names = input.files?.filter(Boolean) ?? [];
    if (names.length < 2) {
      throw new BadRequestException('Au moins 2 images pour un éventail');
    }
    if (names.length > 9) {
      throw new BadRequestException('Maximum 9 images');
    }

    const resolved = await this.cards.resolveExistingPaths(names);
    if (resolved.length !== names.length) {
      throw new BadRequestException(
        'Certains fichiers sont introuvables dans images-jeux/arbre_de_vie/',
      );
    }

    const thumbW = 240;
    const n = resolved.length;
    const spread = 720;
    const startX = 80;
    const width = 1100;
    const height = 520;
    const bg = { r: 244, g: 247, b: 242, alpha: 1 };

    const composites: sharp.OverlayOptions[] = [];
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0.5 : i / (n - 1);
      const left = Math.round(startX + t * spread - thumbW / 2);
      const rotate = -28 + 56 * t;
      const top = 40 + Math.round(Math.sin(t * Math.PI) * 28);

      // Réduire d’abord (fichiers carte souvent très lourds) puis rotation — évite les OOM / échecs Sharp.
      const buf = await sharp(resolved[i], { limitInputPixels: false })
        .resize({ width: thumbW, withoutEnlargement: true })
        .rotate(rotate, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();

      composites.push({ input: buf, left, top });
    }

    let outBuf: Buffer;
    try {
      outBuf = await sharp({
        create: {
          width,
          height,
          channels: 4,
          background: bg,
        },
      })
        .composite(composites)
        .png()
        .toBuffer();
    } catch (e) {
      const msg = (e as Error).message;
      this.logger.error(`Sharp composite: ${msg}`);
      throw new InternalServerErrorException(`Sharp composite failed: ${msg}`);
    }

    const outDir = getGeneratedImagesDir();
    await mkdir(outDir, { recursive: true });

    const slug =
      input.outputSlug?.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80) ||
      `fan-${createHash('sha256').update(randomBytes(8)).digest('hex').slice(0, 10)}`;

    const fileName = slug.endsWith('.png') ? slug : `${slug}.png`;
    const outPath = path.join(outDir, fileName);
    await writeFile(outPath, outBuf);

    this.logger.log(`Fan composed -> ${outPath}`);
    return { path: outPath };
  }
}
