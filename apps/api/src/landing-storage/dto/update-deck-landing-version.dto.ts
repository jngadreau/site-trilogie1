import { IsArray, IsBoolean, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateDeckLandingVersionDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sectionOrder?: string[];

  @IsOptional()
  @IsObject()
  variantsBySection?: Record<string, string>;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  label?: string;

  /**
   * Si true (défaut côté service quand sectionOrder + variantsBySection sont fournis),
   * reconstruit `content.sections` en squelettes vides alignés sur l’ordre.
   */
  @IsOptional()
  @IsBoolean()
  rebuildContentSections?: boolean;

  /**
   * ex. `{ "autoGenerateImages": true }` — défaut logique `true` si absent.
   * @see docs/landing-image-management-plan.md
   */
  @IsOptional()
  @IsObject()
  buildOptions?: Record<string, unknown>;
}
