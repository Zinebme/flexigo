export function safeLamsaExternalUrl(input: string | null | undefined): string | null {
  if (!input) return null;
  try {
    const parsed = new URL(input);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}
