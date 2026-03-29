import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateDeckLandingProjectDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8000)
  description?: string;

  @IsOptional()
  @IsObject()
  sectionDescriptions?: Record<string, string>;
}
