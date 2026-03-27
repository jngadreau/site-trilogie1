import { Injectable, NotFoundException } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { getSiteManifestPath } from '../paths';

export interface SiteManifest {
  version: number;
  gameId: string;
  title: string;
  subtitle?: string;
  hero: {
    imageFile: string;
    markdownFile: string;
    imageAlt?: string;
  };
  cta?: {
    label: string;
    href: string;
    openInNewTab?: boolean;
  };
  meta?: {
    description?: string;
  };
}

@Injectable()
export class SiteService {
  async getManifest(): Promise<SiteManifest> {
    const p = getSiteManifestPath();
    let raw: string;
    try {
      raw = await readFile(p, 'utf8');
    } catch {
      throw new NotFoundException('site.manifest.json introuvable (content/arbre-de-vie/)');
    }
    try {
      return JSON.parse(raw) as SiteManifest;
    } catch {
      throw new NotFoundException('site.manifest.json invalide (JSON)');
    }
  }
}
