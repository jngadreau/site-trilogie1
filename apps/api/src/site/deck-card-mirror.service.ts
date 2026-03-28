import { Injectable, Logger } from '@nestjs/common';
import { copyFile, mkdir, readdir, stat } from 'fs/promises';
import * as path from 'path';
import { getCardImagesArbreDeVieDir, getMirroredDeckCardImagesDir } from '../paths';

/**
 * Copie temporaire des visuels cartes depuis `images-jeux/` vers
 * `content/generated/.../images/deck-cards/` (même racine que les PNG Grok).
 */
@Injectable()
export class DeckCardMirrorService {
  private readonly logger = new Logger(DeckCardMirrorService.name);

  async syncFromGameFolder(): Promise<{
    destDir: string;
    sourceDir: string;
    copied: number;
    skipped: number;
    files: string[];
  }> {
    const sourceDir = path.resolve(getCardImagesArbreDeVieDir());
    const destDir = path.resolve(getMirroredDeckCardImagesDir());
    await mkdir(destDir, { recursive: true });

    let names: string[] = [];
    try {
      names = await readdir(sourceDir);
    } catch (e) {
      this.logger.warn(`Lecture images-jeux impossible: ${(e as Error).message}`);
      return { destDir, sourceDir, copied: 0, skipped: 0, files: [] };
    }

    const ok = (n: string) =>
      /\.(png|jpe?g|webp)$/i.test(n) && !n.startsWith('.') && n !== 'metadata.json';

    const imageNames = names.filter(ok).sort();
    let copied = 0;
    let skipped = 0;

    for (const name of imageNames) {
      const from = path.join(sourceDir, name);
      const to = path.join(destDir, name);
      try {
        const st = await stat(from);
        if (!st.isFile()) {
          skipped += 1;
          continue;
        }
        await copyFile(from, to);
        copied += 1;
      } catch (e) {
        this.logger.warn(`Copie ${name}: ${(e as Error).message}`);
        skipped += 1;
      }
    }

    this.logger.log(`deck-cards mirror: ${copied} copiés, ${skipped} ignorés/erreurs`);
    return {
      destDir,
      sourceDir,
      copied,
      skipped,
      files: imageNames,
    };
  }
}
