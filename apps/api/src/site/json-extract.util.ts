/** Extrait le premier tableau JSON d’une réponse LLM (fences ``` ou brut). */
export function extractFirstJsonArray(text: string): string {
  let s = text.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```/m.exec(s);
  if (fence) s = fence[1].trim();
  const start = s.indexOf('[');
  const end = s.lastIndexOf(']');
  if (start < 0 || end <= start) {
    return '[]';
  }
  return s.slice(start, end + 1);
}

/** Extrait le premier objet JSON d’une réponse LLM (fences ``` ou brut). */
export function extractFirstJsonObject(text: string): string {
  let s = text.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```/m.exec(s);
  if (fence) s = fence[1].trim();
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start >= 0 && end > start) return s.slice(start, end + 1);
  return s;
}
