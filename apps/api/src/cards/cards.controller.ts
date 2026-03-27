import {
  Controller,
  Get,
  NotFoundException,
  Param,
  StreamableFile,
} from '@nestjs/common';
import { CardsService } from './cards.service';

@Controller('cards')
export class CardsController {
  constructor(private readonly cards: CardsService) {}

  @Get('arbre-de-vie')
  async list() {
    return this.cards.listArbreDeVie();
  }

  @Get('arbre-de-vie/:filename')
  async file(@Param('filename') filename: string): Promise<StreamableFile> {
    try {
      const { buffer, mime } = await this.cards.readCardImage(filename);
      const safe = filename.split('/').pop() ?? filename;
      return new StreamableFile(buffer, {
        type: mime,
        disposition: `inline; filename="${encodeURIComponent(safe)}"`,
      });
    } catch (e) {
      if (e instanceof NotFoundException) throw e;
      throw e;
    }
  }
}
