import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SuggestLandingStructureDto {
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  brief?: string;
}
