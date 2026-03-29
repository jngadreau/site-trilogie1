import { IsOptional, IsString, MaxLength } from 'class-validator';

export class PatchDeckLandingContentGlobalsDto {
  @IsOptional()
  @IsString()
  @MaxLength(12_000)
  visualBrief?: string;

  @IsOptional()
  @IsString()
  @MaxLength(48_000)
  visualBriefMarkdown?: string;
}
