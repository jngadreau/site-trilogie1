import { IsOptional, IsString, MaxLength } from 'class-validator';

export class GenerateImageDto {
  @IsString()
  @MaxLength(8_000)
  prompt!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  outputSlug?: string;

  /** Ex. 16:9, 1:1 — transmis à l’API xAI si supporté. */
  @IsOptional()
  @IsString()
  @MaxLength(16)
  aspectRatio?: string;
}
