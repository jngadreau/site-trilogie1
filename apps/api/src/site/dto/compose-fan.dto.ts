import { ArrayMaxSize, ArrayMinSize, IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

export class ComposeFanDto {
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(9)
  @IsString({ each: true })
  files!: string[];

  @IsOptional()
  @IsString()
  @MaxLength(100)
  outputSlug?: string;
}
