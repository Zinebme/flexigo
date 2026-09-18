/**
 * Algerian telephone number normalization and validation.
 *
 * Normalized form: "213" + 9 digits (e.g. "213550123456").
 * The normalized number is the key used to match repeat customers
 * (combined with store_id — never across tenants).
 */

/** Strip everything except digits and a leading +. */
export function stripPhone(raw: string): string {
  let out = raw.replace(/[^\d+]/g, "");
  if (out.startsWith("+")) out = "+" + out.slice(1).replace(/\+/g, "");
  return out;
}

/**
 * Normalize an Algerian phone number to "213XXXXXXXXX" (12 digits).
 * Returns null when the number cannot be interpreted as an Algerian number.
 */
export function normalizeDZPhone(raw: string): string | null {
  let p = stripPhone(raw);
  if (!p) return null;
  if (p === "+") return null;

  if (p.startsWith("+")) {
    p = p.slice(1);
    if (!p.startsWith("213")) return null;
    p = p.slice(3);
  } else if (p.startsWith("00213")) {
    p = p.slice(5);
  } else if (p.startsWith("0213") && p.length === 11) {
    p = p.slice(2);
  } else if (p.startsWith("213") && p.length === 12) {
    p = p.slice(3);
  } else if (p.startsWith("0") && p.length === 10) {
    p = p.slice(1);
  }

  if (!/^\d{9}$/.test(p)) return null;
  return "213" + p;
}

/**
 * Validate a mobile number for COD orders: must be a mobile line (05/06/07).
 */
export function isValidDZMobile(raw: string): boolean {
  const n = normalizeDZPhone(raw);
  if (!n) return false;
  const second = n.charAt(3);
  return second === "5" || second === "6" || second === "7";
}

/** Display form: +213 550 12 34 56 */
export function formatDZPhone(normalized: string | null): string {
  if (!normalized || !/^\d{12}$/.test(normalized)) return normalized ?? "—";
  const p = normalized.slice(3);
  return `+213 ${p.slice(0, 3)} ${p.slice(3, 5)} ${p.slice(5, 7)} ${p.slice(7)}`;
}
