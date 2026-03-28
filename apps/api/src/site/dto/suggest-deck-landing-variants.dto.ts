import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SuggestDeckLandingVariantsDto {
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  brief?: string;
}
