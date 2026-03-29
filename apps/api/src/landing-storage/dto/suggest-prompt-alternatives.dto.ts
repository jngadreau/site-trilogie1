import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class SuggestPromptAlternativesDto {
  @IsString()
  sectionId!: string;

  @IsString()
  slotId!: string;

  /** Nombre de variantes demandées (défaut 6). */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(5)
  @Max(12)
  count?: number;
}
