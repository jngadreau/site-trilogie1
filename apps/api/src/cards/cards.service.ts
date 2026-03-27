import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { readdir, readFile, writeFile } from 'fs/promises';
import * as path from 'path';
import sharp from 'sharp';
import { getCardImagesArbreDeVieDir } from '../paths';
import type {
  CardAspectRatioBlock,
  CardPixelSample,
  PhysicalSizeMm,
} from './card-metadata.types';

const DEFAULT_PHYSICAL_MM: PhysicalSizeMm = { width: 51, height: 153 };
/** Écart relatif max entre ratio pixel et ratio mm (fonds perdus, etc.). */
const RATIO_MATCH_REL_TOLERANCE = 0.08;

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

  private pickSampleFilename(names: string[]): string | null {
    const imgs = names.filter(
      (n) => /\.(png|jpe?g|webp)$/i.test(n) && !n.startsWith('.'),
    );
    const fronts = imgs.filter((n) => /front/i.test(n));
    const pool = fronts.length ? fronts : imgs;
    if (!pool.length) return null;
    return [...pool].sort((a, b) => a.localeCompare(b, 'fr'))[0];
  }

  private buildAspectBlock(
    physical: PhysicalSizeMm,
    sample: CardPixelSample | null,
  ): CardAspectRatioBlock {
    const rMm = physical.width / physical.height;
    let rPx: number | null = null;
    let css = `${physical.width} / ${physical.height}`;
    if (sample) {
      rPx = sample.width / sample.height;
      css = `${sample.width} / ${sample.height}`;
    }
    let matches = false;
    if (rPx != null && rMm > 0) {
      matches = Math.abs(rPx / rMm - 1) <= RATIO_MATCH_REL_TOLERANCE;
    }
    return {
      physicalSizeMm: physical,
      widthToHeightFromPhysicalMm: rMm,
      pixelSample: sample,
      widthToHeightFromPixels: rPx,
      cssAspectRatio: css,
      pixelRatioMatchesPhysicalMmApprox: matches,
    };
  }

  /** Mesure pixels sur une image du dossier cartes. */
  private async measurePixelSample(
    sampleFile: string,
  ): Promise<{ width: number; height: number } | null> {
    const dir = path.resolve(getCardImagesArbreDeVieDir());
    const full = path.join(dir, sampleFile);
    const meta = await sharp(full).metadata();
    const w = meta.width;
    const h = meta.height;
    if (!w || !h) return null;
    return { width: w, height: h };
  }

  /**
   * Résumé format carte : mm (fichier ou défaut 51×153) + ratio mesuré sur un PNG/JPG.
   */
  async getCardFormatSummary(): Promise<CardAspectRatioBlock> {
    const dir = path.resolve(getCardImagesArbreDeVieDir());
    const metaPath = path.join(dir, 'metadata.json');
    let raw: Record<string, unknown> = {};
    try {
      raw = JSON.parse(await readFile(metaPath, 'utf8')) as Record<string, unknown>;
    } catch {
      raw = {};
    }
    const pm = raw.physicalSizeMm as PhysicalSizeMm | undefined;
    const physical =
      pm &&
      typeof pm.width === 'number' &&
      typeof pm.height === 'number' &&
      pm.width > 0 &&
      pm.height > 0
        ? pm
        : DEFAULT_PHYSICAL_MM;

    const list = await this.listArbreDeVie();
    const sampleName = this.pickSampleFilename(list.files);
    let sample: CardPixelSample | null = null;
    if (sampleName) {
      try {
        const dim = await this.measurePixelSample(sampleName);
        if (dim) sample = { file: sampleName, ...dim };
      } catch {
        /* fichier illisible */
      }
    }

    return this.buildAspectBlock(physical, sample);
  }

  /** Document metadata.json fusionné avec un bloc `cardAspectRatio` à jour (mesure live). */
  async getMetadataDocument(): Promise<Record<string, unknown>> {
    const dir = path.resolve(getCardImagesArbreDeVieDir());
    const metaPath = path.join(dir, 'metadata.json');
    let raw: Record<string, unknown> = {};
    try {
      raw = JSON.parse(await readFile(metaPath, 'utf8')) as Record<string, unknown>;
    } catch {
      raw = {};
    }
    const block = await this.getCardFormatSummary();
    return {
      ...raw,
      physicalSizeMm: block.physicalSizeMm,
      cardAspectRatio: block,
    };
  }

  /** Écrit `metadata.json` avec `physicalSizeMm` et `cardAspectRatio` mesurés. */
  async refreshCardMetadataFile(): Promise<Record<string, unknown>> {
    const dir = path.resolve(getCardImagesArbreDeVieDir());
    const metaPath = path.join(dir, 'metadata.json');
    let raw: Record<string, unknown> = {};
    try {
      raw = JSON.parse(await readFile(metaPath, 'utf8')) as Record<string, unknown>;
    } catch {
      raw = {};
    }
    if (!raw.physicalSizeMm) {
      raw.physicalSizeMm = { ...DEFAULT_PHYSICAL_MM };
    }
    const pm = raw.physicalSizeMm as PhysicalSizeMm;
    const physical =
      pm &&
      typeof pm.width === 'number' &&
      typeof pm.height === 'number' &&
      pm.width > 0 &&
      pm.height > 0
        ? pm
        : DEFAULT_PHYSICAL_MM;
    raw.physicalSizeMm = physical;

    const list = await this.listArbreDeVie();
    const sampleName = this.pickSampleFilename(list.files);
    let sample: CardPixelSample | null = null;
    if (sampleName) {
      try {
        const dim = await this.measurePixelSample(sampleName);
        if (dim) sample = { file: sampleName, ...dim };
      } catch {
        /* ignore */
      }
    }
    raw.cardAspectRatio = this.buildAspectBlock(physical, sample);
    await writeFile(metaPath, JSON.stringify(raw, null, 2) + '\n', 'utf8');
    return raw;
  }
}
