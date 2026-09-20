/** NOOR — allow-list for merchant-provided external links (social / contact). */
export function safeNoorExternalUrl(input: string | null | undefined): string | null {
  if (!input) return null;
  try {
    const parsed = new URL(input);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}
