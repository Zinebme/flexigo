/**
 * Secure upload validation (server-side, before Supabase Storage write).
 * - strict MIME allow-list + max size
 * - real image dimension parsing (PNG / JPEG / WebP / GIF) for quality warnings
 * - SVG sanitization (logos/favicons only): no scripts, no event handlers,
 *   no javascript: URIs
 *
 * Recommended dimensions are warnings only — harmless images are not
 * rejected, but the UI shows a quality warning.
 */

export type UploadPurpose = "product" | "banner" | "logo" | "favicon" | "category" | "review";

export const UPLOAD_LIMITS: Record<UploadPurpose, { maxBytes: number; mimes: string[]; recommended?: { w: number; h: number } }> = {
  product: { maxBytes: 2 * 1024 * 1024, mimes: ["image/jpeg", "image/png", "image/webp"], recommended: { w: 800, h: 800 } },
  banner: { maxBytes: 4 * 1024 * 1024, mimes: ["image/jpeg", "image/png", "image/webp"], recommended: { w: 1600, h: 700 } },
  logo: { maxBytes: 1 * 1024 * 1024, mimes: ["image/png", "image/jpeg", "image/webp", "image/svg+xml"], recommended: { w: 400, h: 400 } },
  favicon: { maxBytes: 256 * 1024, mimes: ["image/png", "image/svg+xml"], recommended: { w: 64, h: 64 } },
  category: { maxBytes: 2 * 1024 * 1024, mimes: ["image/jpeg", "image/png", "image/webp"], recommended: { w: 600, h: 400 } },
  review: { maxBytes: 1 * 1024 * 1024, mimes: ["image/jpeg", "image/png", "image/webp"], recommended: { w: 600, h: 400 } },
};

export interface Dimensions {
  width: number;
  height: number;
  format: "png" | "jpeg" | "webp" | "gif";
}

/** Minimal pure-JS dimension parser (no native deps). Returns null if unknown. */
export function parseImageDimensions(buf: Buffer): Dimensions | null {
  if (buf.length < 12) return null;
  // PNG
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    if (buf.length < 24) return null;
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20), format: "png" };
  }
  // GIF
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) {
    return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8), format: "gif" };
  }
  // JPEG
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let off = 2;
    while (off + 4 < buf.length) {
      if (buf[off] !== 0xff) {
        off++;
        continue;
      }
      const marker = buf[off + 1]!;
      const len = buf.readUInt16BE(off + 2);
      if (marker >= 0xc0 && marker <= 0xc3) {
        return { height: buf.readUInt16BE(off + 5), width: buf.readUInt16BE(off + 7), format: "jpeg" };
      }
      off += 2 + len;
    }
    return null;
  }
  // WebP
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    const chunk = buf.toString("ascii", 12, 16);
    if (chunk === "VP8 " && buf.length >= 30) {
      const w = buf.readUInt16LE(26) & 0x3fff;
      const h = buf.readUInt16LE(28) & 0x3fff;
      return { width: w, height: h, format: "webp" };
    }
    if (chunk === "VP8L" && buf.length >= 25) {
      const b0 = buf[21]!, b1 = buf[22]!, b2 = buf[23]!, b3 = buf[24]!;
      const w = 1 + ((b1 & 0x3f) << 8 | b0);
      const h = 1 + ((b3 & 0x0f) << 10 | (b2 & 0xf) << 8 | (b1 >> 2));
      return { width: w, height: h, format: "webp" };
    }
    if (chunk === "VP8X" && buf.length >= 30) {
      const w = 1 + buf.readUIntLE(24, 3);
      const h = 1 + buf.readUIntLE(27, 3);
      return { width: w, height: h, format: "webp" };
    }
    return null;
  }
  return null;
}

/** Sanitize an inline SVG string. Throws when unsafe content is present. */
export function sanitizeSvg(svg: string): string {
  const lower = svg.toLowerCase();
  if (lower.includes("<script") || /on\w+\s*=/i.test(svg) || lower.includes("javascript:")) {
    throw new Error("SVG non autorisé (contenu actif détecté).");
  }
  return svg.slice(0, 100 * 1024);
}

export interface UploadValidation {
  ok: boolean;
  error?: string;
  warnings: string[];
  dimensions: Dimensions | null;
  isSvg: boolean;
  sanitizedSvg?: string;
}

export function validateUpload(buffer: Buffer, declaredMime: string | null, purpose: UploadPurpose): UploadValidation {
  const limits = UPLOAD_LIMITS[purpose];
  const warnings: string[] = [];

  const mime = (declaredMime || "").toLowerCase();
  if (!limits.mimes.includes(mime)) {
    return { ok: false, error: "Format non autorisé. Utilisez JPG, PNG ou WebP (SVG pour les logos).", warnings, dimensions: null, isSvg: false };
  }

  if (buffer.byteLength > limits.maxBytes) {
    return { ok: false, error: `Fichier trop lourd (maximum ${Math.round(limits.maxBytes / 1024 / 1024 * 10) / 10} Mo).`, warnings, dimensions: null, isSvg: false };
  }

  if (mime === "image/svg+xml") {
    const text = buffer.toString("utf8");
    if (!text.trim().startsWith("<svg")) {
      return { ok: false, error: "SVG invalide.", warnings, dimensions: null, isSvg: true };
    }
    const sanitizedSvg = sanitizeSvg(text);
    return { ok: true, warnings, dimensions: null, isSvg: true, sanitizedSvg };
  }

  const dimensions = parseImageDimensions(buffer);
  if (!dimensions) {
    return { ok: false, error: "Image illisible ou corrompue.", warnings, dimensions: null, isSvg: false };
  }

  const rec = limits.recommended;
  if (rec) {
    if (dimensions.width < rec.w / 2 || dimensions.height < rec.h / 2) {
      warnings.push(
        `Résolution faible (${dimensions.width}×${dimensions.height}). Recommandé : ${rec.w}×${rec.h} px minimum.`,
      );
    }
  }

  return { ok: true, warnings, dimensions, isSvg: false };
}

/** Storage path convention: stores/{store_id}/{purpose}/{filename} */
export function storagePath(storeId: string, purpose: string, filename: string): string {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
  return `stores/${storeId}/${purpose}/${safe}`;
}
