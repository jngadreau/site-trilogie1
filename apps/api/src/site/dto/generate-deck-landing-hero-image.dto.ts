import { IsOptional, IsString, MaxLength } from 'class-validator';

export class GenerateDeckLandingHeroImageDto {
  @IsOptional()
  @IsString()
  @MaxLength(12000)
  prompt?: string;
}
