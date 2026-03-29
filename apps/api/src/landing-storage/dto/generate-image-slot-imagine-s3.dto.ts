import { IsOptional, IsString, MinLength } from 'class-validator';

export class GenerateImageSlotImagineS3Dto {
  @IsString()
  @MinLength(1)
  sectionId: string;

  @IsString()
  @MinLength(1)
  slotId: string;

  /** Si fourni, remplace la scène pour cette génération uniquement (et l’enregistre dans media + imageSlots). */
  @IsOptional()
  @IsString()
  sceneDescription?: string;
}
