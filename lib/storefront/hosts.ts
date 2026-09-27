/** Hostname classification shared by the proxy and storefront links. */
export function cleanHostname(host: string): string {
  return host.trim().toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "");
}

export function platformHostname(): string {
  try {
    return new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://marqova.shop").hostname.toLowerCase();
  } catch {
    return "marqova.shop";
  }
}

const RESERVED = new Set(["www", "admin", "dashboard", "api", "auth", "login", "register", "preview"]);

export function subdomainStoreSlug(host: string): string | null {
  const suffix = `.${platformHostname()}`;
  const hostname = cleanHostname(host);
  if (!hostname.endsWith(suffix)) return null;
  const slug = hostname.slice(0, -suffix.length);
  return /^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$/.test(slug) && !RESERVED.has(slug) ? slug : null;
}
