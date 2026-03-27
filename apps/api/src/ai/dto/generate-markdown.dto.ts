import { IsOptional, IsString, MaxLength } from 'class-validator';

export class GenerateMarkdownDto {
  /** Consigne métier (ex. « Rédige le bloc hero du site pour cet oracle »). */
  @IsString()
  @MaxLength(8_000)
  instruction!: string;

  /** Extrait du livret ou autre contexte brut (Markdown autorisé). */
  @IsString()
  @MaxLength(120_000)
  contextMarkdown!: string;

  /** Nom de fichier sans extension ; défaut dérivé de la date + hash court. */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  outputSlug?: string;
}
