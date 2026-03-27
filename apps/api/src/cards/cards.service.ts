import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { readdir, readFile } from 'fs/promises';
import * as path from 'path';
import { getCardImagesArbreDeVieDir } from '../paths';

@Injectable()
export class CardsService {
  private safeName(name: string): string {
    const base = path.basename(name);
    if (!/^[\w.-]+\.(png|jpe?g|webp)$/i.test(base)) {
      throw new BadRequestException('Invalid card image filename');
    }
    return base;
  }

  async listArbreDeVie(): Promise<{ files: string[] }> {
    const dir = path.resolve(getCardImagesArbreDeVieDir());
    let names: string[] = [];
    try {
      names = await readdir(dir);
    } catch {
      return { files: [] };
    }
    const ok = (n: string) =>
      /\.(png|jpe?g|webp)$/i.test(n) && !n.startsWith('.');
    return { files: names.filter(ok).sort() };
  }

  async readCardImage(filename: string): Promise<{ buffer: Buffer; mime: string }> {
    const safe = this.safeName(filename);
    const dir = path.resolve(getCardImagesArbreDeVieDir());
    const full = path.resolve(dir, safe);
    const rel = path.relative(dir, full);
    if (rel.startsWith('..') || path.isAbsolute(rel)) {
      throw new BadRequestException('Invalid path');
    }
    let buffer: Buffer;
    try {
      buffer = await readFile(full);
    } catch {
      throw new NotFoundException(safe);
    }
    const lower = safe.toLowerCase();
    const mime = lower.endsWith('.webp')
      ? 'image/webp'
      : lower.endsWith('.jpg') || lower.endsWith('.jpeg')
        ? 'image/jpeg'
        : 'image/png';
    return { buffer, mime };
  }

  /** Chemins absolus pour Sharp (fichiers présents uniquement). */
  async resolveExistingPaths(filenames: string[]): Promise<string[]> {
    const dir = path.resolve(getCardImagesArbreDeVieDir());
    const out: string[] = [];
    for (const f of filenames) {
      let safe: string;
      try {
        safe = this.safeName(f);
      } catch {
        continue;
      }
      const full = path.resolve(dir, safe);
      const rel = path.relative(dir, full);
      if (rel.startsWith('..') || path.isAbsolute(rel)) continue;
      try {
        await readFile(full);
        out.push(full);
      } catch {
        /* skip */
      }
    }
    return out;
  }
}
