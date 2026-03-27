import { Controller, Get } from '@nestjs/common';
import { SiteService } from './site.service';

@Controller('site')
export class SiteController {
  constructor(private readonly site: SiteService) {}

  /** Manifeste éditorial versionné pour l’aperçu landing et le futur front. */
  @Get('manifest')
  async manifest() {
    return this.site.getManifest();
  }
}
