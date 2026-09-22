const LOCAL_APP_URL = "http://localhost:3000";

/**
 * Canonical platform URL used in auth emails.
 *
 * Never derive this value from the request Host header: merchant custom domains
 * must not become authentication callback hosts.
 */
export function getPlatformAppUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const value = configured || (process.env.NODE_ENV === "production" ? "" : LOCAL_APP_URL);

  if (!value) {
    throw new Error("NEXT_PUBLIC_APP_URL is required to send authentication emails.");
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("NEXT_PUBLIC_APP_URL must be an absolute URL.");
  }

  const isLocalhost = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (url.protocol !== "https:" && !isLocalhost) {
    throw new Error("NEXT_PUBLIC_APP_URL must use HTTPS outside local development.");
  }

  return url.origin;
}

export function getInviteRedirectUrl(): string {
  return `${getPlatformAppUrl()}/auth/finish`;
}
