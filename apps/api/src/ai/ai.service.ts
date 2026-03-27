import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { mkdir, writeFile } from 'fs/promises';
import * as path from 'path';
import { createHash, randomBytes } from 'crypto';
import { GenerateMarkdownDto } from './dto/generate-markdown.dto';

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

  private getOutputDir(): string {
    const override = this.config.get<string>('CONTENT_GENERATED_DIR')?.trim();
    if (override) {
      return path.isAbsolute(override) ? override : path.resolve(process.cwd(), override);
    }
    return path.resolve(process.cwd(), '..', '..', 'content', 'generated', 'arbre-de-vie');
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

    const outDir = this.getOutputDir();
    await mkdir(outDir, { recursive: true });

    const fromUser = dto.outputSlug?.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100).replace(/^[._-]+|[._-]+$/g, '') ?? '';
    const slug =
      fromUser ||
      `gen-${new Date().toISOString().replace(/[:.]/g, '-')}-${createHash('sha256').update(randomBytes(16)).digest('hex').slice(0, 10)}`;

    const filePath = path.join(outDir, `${slug}.md`);
    const header = `---\ngeneratedAt: ${new Date().toISOString()}\nmodel: ${model}\n---\n\n`;
    await writeFile(filePath, header + text.trim() + '\n', 'utf8');

    const preview = text.trim().slice(0, 400) + (text.length > 400 ? '…' : '');
    return { path: filePath, model, preview };
  }
}
