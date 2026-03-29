import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';

export class PatchDeckLandingBackgroundImageDto {
  @IsString()
  @MaxLength(4000)
  imageUrl!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  imageAlt?: string;
}

export class PatchDeckLandingContentGlobalsDto {
  @IsOptional()
  @IsString()
  @MaxLength(12_000)
  visualBrief?: string;

  @IsOptional()
  @IsString()
  @MaxLength(48_000)
  visualBriefMarkdown?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PatchDeckLandingBackgroundImageDto)
  backgroundImage?: PatchDeckLandingBackgroundImageDto;

  /** Supprime `globals.backgroundImage`. */
  @IsOptional()
  @IsBoolean()
  clearBackgroundImage?: boolean;
}
