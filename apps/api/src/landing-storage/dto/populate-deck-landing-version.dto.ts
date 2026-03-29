import { IsOptional, IsString, MaxLength } from 'class-validator';

export class PopulateDeckLandingVersionDto {
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  brief?: string;
}
