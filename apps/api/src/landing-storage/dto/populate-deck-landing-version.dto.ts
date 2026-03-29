import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class PopulateDeckLandingVersionDto {
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  brief?: string;

  /** Si true : n’enchaîne pas Imagine→S3 même si la version a `autoGenerateImages` activé. */
  @IsOptional()
  @IsBoolean()
  skipAutoImagine?: boolean;
}
