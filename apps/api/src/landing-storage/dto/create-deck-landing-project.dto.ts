import { IsObject, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreateDeckLandingProjectDto {
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'gameKey doit être kebab-case (ex. arbre-de-vie)',
  })
  @MaxLength(64)
  gameKey!: string;

  @IsString()
  @Matches(/^[a-zA-Z0-9._-]+$/, { message: 'slug : lettres, chiffres, . _ -' })
  @MaxLength(120)
  slug!: string;

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
