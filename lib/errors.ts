/**
 * Error handling layer.
 *
 * User-facing errors are clear and non-technical (French). Technical detail
 * is kept in system_events (visible to Super Admin only) and server logs.
 * Secrets are scrubbed from any recorded message.
 */

export type AppErrorCode =
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "VALIDATION"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "STORE_SUSPENDED"
  | "CONFIG_MISSING"
  | "INTEGRATION_ERROR"
  | "UPSTREAM_ERROR"
  | "DUPLICATE"
  | "UNSUPPORTED";

export class AppError extends Error {
  constructor(
    public readonly code: AppErrorCode,
    message: string,
    public readonly status: number = 400,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

const CODE_STATUS: Record<AppErrorCode, number> = {
  NOT_FOUND: 404,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  VALIDATION: 400,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  STORE_SUSPENDED: 403,
  CONFIG_MISSING: 503,
  INTEGRATION_ERROR: 502,
  UPSTREAM_ERROR: 502,
  DUPLICATE: 409,
  UNSUPPORTED: 501,
};

/** Create an AppError with a sane default status for its code. */
export function err(
  code: AppErrorCode,
  message: string,
  details?: unknown,
): AppError {
  return new AppError(code, message, CODE_STATUS[code], details);
}

/** Strip anything that looks like a credential from free-text messages. */
export function scrubSecrets(message: string): string {
  return message
    .replace(/(eyJ[A-Za-z0-9_-]{10,})/g, "[redacted-jwt]")
    .replace(/(sk-[A-Za-z0-9_-]{10,})/g, "[redacted-key]")
    .replace(/(AIza[0-9A-Za-z_-]{20,})/g, "[redacted-gapi]")
    .replace(/(Bearer\s+[A-Za-z0-9._-]{10,})/gi, "Bearer [redacted]")
    .replace(/(fxenc1\.[A-Za-z0-9+/=]+)/g, "[redacted-secret]");
}

const PUBLIC_MESSAGES: Record<AppErrorCode, string> = {
  NOT_FOUND: "Élément introuvable.",
  UNAUTHORIZED: "Veuillez vous connecter pour continuer.",
  FORBIDDEN: "Vous n'avez pas accès à cette ressource.",
  VALIDATION: "Veuillez vérifier les informations saisies.",
  CONFLICT: "Cette action entre en conflit avec l'état actuel.",
  RATE_LIMITED: "Trop de tentatives. Veuillez réessayer dans quelques minutes.",
  STORE_SUSPENDED: "Ce site est momentanément suspendu.",
  CONFIG_MISSING: "Service momentanément indisponible. Veuillez réessayer plus tard.",
  INTEGRATION_ERROR: "Le service externe n'a pas pu être contacté. Veuillez réessayer.",
  UPSTREAM_ERROR: "Une erreur est survenue. Veuillez réessayer.",
  DUPLICATE: "Cette opération a déjà été effectuée.",
  UNSUPPORTED: "Cette fonctionnalité n'est pas encore disponible.",
};

function isAppError(e: unknown): e is AppError {
  return e instanceof AppError;
}

/**
 * Convert any thrown value into a safe JSON API error response.
 * The `message` of an AppError is shown to the user; unknown errors are
 * logged with scrubbed technical detail and a generic message is returned.
 */
export function toErrorResponse(e: unknown): Response {
  if (isAppError(e)) {
    return Response.json(
      { ok: false, error: { code: e.code, message: e.message } },
      { status: e.status },
    );
  }
  const message = e instanceof Error ? scrubSecrets(e.message) : "Erreur inattendue.";
  console.error("[flexigo:api]", e instanceof Error ? e.stack ?? message : message);
  return Response.json(
    { ok: false, error: { code: "UPSTREAM_ERROR", message: PUBLIC_MESSAGES.UPSTREAM_ERROR } },
    { status: 500 },
  );
}

/** Generic message fallback for pages that need a friendly French string. */
export function publicMessage(e: unknown): string {
  if (isAppError(e)) return e.message;
  return PUBLIC_MESSAGES.UPSTREAM_ERROR;
}
