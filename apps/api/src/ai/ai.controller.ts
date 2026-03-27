import { Body, Controller, Post } from '@nestjs/common';
import { AiService } from './ai.service';
import { GenerateMarkdownDto } from './dto/generate-markdown.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  /**
   * Génère un fichier Markdown via Grok (chat) à partir du contexte livret + consigne.
   * Écrit sous content/generated/arbre-de-vie/
   */
  @Post('generate-markdown')
  async generateMarkdown(@Body() dto: GenerateMarkdownDto) {
    return this.ai.generateMarkdownToFile(dto);
  }
}
