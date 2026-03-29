import { IsObject, IsString, MinLength } from 'class-validator';

/**
 * Fusion dans `content.sections[]` pour `sectionId` : chaque clé de `patch` remplace la clé
 * correspondante (sauf `id`, ignorée). `undefined` côté client n’est pas transmissible en JSON —
 * pour supprimer une clé, utiliser une évolution ultérieure ; ici on remplace seulement les clés envoyées.
 */
export class PatchDeckLandingContentSectionDto {
  @IsString()
  @MinLength(1)
  sectionId: string;

  @IsObject()
  patch: Record<string, unknown>;
}
