import {
  IsArray,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateDeckLandingVersionDto {
  @IsObject()
  content!: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sectionOrder?: string[];

  @IsOptional()
  @IsObject()
  variantsBySection?: Record<string, string>;

  @IsOptional()
  @IsIn(['draft', 'published', 'archived'])
  status?: 'draft' | 'published' | 'archived';

  @IsOptional()
  @IsString()
  @MaxLength(200)
  label?: string;
}
