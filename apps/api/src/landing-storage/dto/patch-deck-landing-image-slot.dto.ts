import { Type } from 'class-transformer';
import { IsIn, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';

export class PatchDeckLandingImageSlotResolvedDto {
  @IsString()
  imageUrl!: string;

  @IsOptional()
  @IsString()
  imageAlt?: string;

  @IsOptional()
  @IsIn(['upload', 'grok_imagine', 'midjourney', 'deck_mirror', 'external'])
  source?: 'upload' | 'grok_imagine' | 'midjourney' | 'deck_mirror' | 'external';
}

export class PatchDeckLandingImageSlotDto {
  @IsString()
  sectionId!: string;

  @IsString()
  slotId!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PatchDeckLandingImageSlotResolvedDto)
  resolved?: PatchDeckLandingImageSlotResolvedDto;

  /** Met à jour `imageSlots` et l’entrée `media` du même `slotId`. */
  @IsOptional()
  @IsString()
  sceneDescription?: string;

  /** Texte alternatif seul (réutilise `resolved.imageUrl` si présent). */
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  imageAlt?: string;
}
