import { IsBoolean, IsOptional } from 'class-validator';

export class GenerateLandingAssetsDto {
  @IsOptional()
  @IsBoolean()
  hero?: boolean;

  @IsOptional()
  @IsBoolean()
  fan?: boolean;
}
