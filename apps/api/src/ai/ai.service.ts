import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { mkdir, writeFile, readdir, readFile } from 'fs/promises';
import * as path from 'path';
import { createHash, randomBytes } from 'crypto';
import { GenerateMarkdownDto } from './dto/generate-markdown.dto';
import { GenerateImageDto } from './dto/generate-image.dto';
import { getContentGeneratedArbreDeVieDir, getGeneratedImagesDir } from '../paths';

const SYSTEM_ORACLE_SITE = `Tu es rédacteur·rice pour le site web public d'un jeu de cartes oracle « L'Arbre de Vie » (Ose Un Pas Vers Toi).
Règles :
- Langue : français.
- Ton : chaleureux, posé, respectueux ; pas de promesses médicales ni de garanties miraculeuses.
- Sortie : uniquement du Markdown propre (titres ##/###, listes, paragraphes). Pas de blocs de code sauf si indispensable.
- Ne pas recopier le contexte mot pour mot : synthétiser et adapter pour une page web courte et percutante.`;

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private readonly config: ConfigService) {}

  private resolveSlug(outputSlug: string | undefined, ext: string): string {
    let raw = outputSlug?.trim() ?? '';
    if (ext === 'md' && /\.md$/i.test(raw)) raw = raw.slice(0, -3);
    if (ext === 'png' && /\.png$/i.test(raw)) raw = raw.slice(0, -4);
    const fromUser =
      raw.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100).replace(/^[._-]+|[._-]+$/g, '') ?? '';
    if (fromUser) return `${fromUser}.${ext}`;
    return `gen-${new Date().toISOString().replace(/[:.]/g, '-')}-${createHash('sha256').update(randomBytes(16)).digest('hex').slice(0, 10)}.${ext}`;
  }

  async generateMarkdownToFile(dto: GenerateMarkdownDto): Promise<{
    path: string;
    model: string;
    preview: string;
  }> {
    const apiKey = this.config.get<string>('GROK_API_KEY') ?? '';
    const baseUrl = this.config.get<string>('GROK_API_URL') ?? 'https://api.x.ai/v1';
    const model =
      this.config.get<string>('GROK_TEXT_MODEL')?.trim() || 'grok-3-mini';

    if (!apiKey) {
      throw new InternalServerErrorException('GROK_API_KEY is not configured');
    }

    const client = new OpenAI({ apiKey, baseURL: baseUrl });

    const userContent = [
      '## Consigne',
      dto.instruction.trim(),
      '',
      '## Contexte (source interne, à ne pas citer comme citation)',
      dto.contextMarkdown.trim(),
    ].join('\n');

    this.logger.log(`Grok chat model=${model} instructionChars=${dto.instruction.length} contextChars=${dto.contextMarkdown.length}`);

    const completion = await client.chat.completions.create({
      model,
      temperature: 0.35,
      max_tokens: 4_096,
      messages: [
        { role: 'system', content: SYSTEM_ORACLE_SITE },
        { role: 'user', content: userContent },
      ],
    });

    const text = completion.choices[0]?.message?.content;
    if (!text?.trim()) {
      throw new InternalServerErrorException('No content from Grok API');
    }

    const outDir = getContentGeneratedArbreDeVieDir();
    await mkdir(outDir, { recursive: true });

    const fileName = this.resolveSlug(dto.outputSlug, 'md');
    const filePath = path.join(outDir, fileName);
    const header = `---\ngeneratedAt: ${new Date().toISOString()}\nmodel: ${model}\n---\n\n`;
    await writeFile(filePath, header + text.trim() + '\n', 'utf8');

    const preview = text.trim().slice(0, 400) + (text.length > 400 ? '…' : '');
    return { path: filePath, model, preview };
  }

  async generateImageToFile(dto: GenerateImageDto): Promise<{
    path: string;
    model: string;
  }> {
    const apiKey = this.config.get<string>('GROK_API_KEY') ?? '';
    const baseUrl = this.config.get<string>('GROK_API_URL') ?? 'https://api.x.ai/v1';
    const model =
      this.config.get<string>('GROK_IMAGE_MODEL')?.trim() || 'grok-imagine-image';

    if (!apiKey) {
      throw new InternalServerErrorException('GROK_API_KEY is not configured');
    }

    const client = new OpenAI({ apiKey, baseURL: baseUrl });

    const imgDir = getGeneratedImagesDir();
    await mkdir(imgDir, { recursive: true });

    this.logger.log(`Grok image model=${model} promptChars=${dto.prompt.length}`);

    const body = {
      model,
      prompt: dto.prompt.trim(),
      n: 1,
      response_format: 'b64_json' as const,
      ...(dto.aspectRatio?.trim()
        ? { aspect_ratio: dto.aspectRatio.trim() }
        : {}),
    };

    const response = await client.images.generate(
      body as Parameters<typeof client.images.generate>[0],
    );

    const b64 = response.data?.[0]?.b64_json;
    if (!b64) {
      throw new InternalServerErrorException('No image data from Grok API');
    }

    const buf = Buffer.from(b64, 'base64');
    const fileName = this.resolveSlug(dto.outputSlug, 'png');
    const filePath = path.join(imgDir, fileName);
    await writeFile(filePath, buf);

    return { path: filePath, model };
  }

  async listGeneratedMarkdown(): Promise<{ files: string[] }> {
    const dir = getContentGeneratedArbreDeVieDir();
    let names: string[] = [];
    try {
      names = await readdir(dir);
    } catch {
      return { files: [] };
    }
    const md = names.filter((n) => n.endsWith('.md') && !n.startsWith('.')).sort();
    return { files: md };
  }

  async readGeneratedMarkdown(filename: string): Promise<string> {
    const safe = path.basename(filename);
    if (!/^[\w.-]+\.md$/.test(safe)) {
      throw new BadRequestException('Invalid filename');
    }
    const dir = path.resolve(getContentGeneratedArbreDeVieDir());
    const full = path.resolve(dir, safe);
    const rel = path.relative(dir, full);
    if (rel.startsWith('..') || path.isAbsolute(rel)) {
      throw new BadRequestException('Invalid path');
    }
    try {
      return await readFile(full, 'utf8');
    } catch {
      throw new NotFoundException(safe);
    }
  }

  async listGeneratedImages(): Promise<{ files: string[] }> {
    const dir = getGeneratedImagesDir();
    let names: string[] = [];
    try {
      names = await readdir(dir);
    } catch {
      return { files: [] };
    }
    const ok = (n: string) =>
      /\.(png|webp|jpe?g)$/i.test(n) && !n.startsWith('.');
    return { files: names.filter(ok).sort() };
  }

  /** Lecture binaire pour StreamableFile (preview). */
  async readGeneratedImage(
    filename: string,
  ): Promise<{ buffer: Buffer; mime: string }> {
    const safe = path.basename(filename);
    if (!/^[\w.-]+\.(png|webp|jpe?g)$/i.test(safe)) {
      throw new BadRequestException('Invalid filename');
    }
    const dir = path.resolve(getGeneratedImagesDir());
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
}
