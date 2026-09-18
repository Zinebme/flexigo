import { getMerchantContext, requireCapability } from "@/lib/auth/merchant-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { validateUpload, storagePath, type UploadPurpose } from "@/lib/storage";
import { toErrorResponse, err } from "@/lib/errors";
import type { Capability } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const STORAGE_BUCKET = "fx-storefront";

const PURPOSE_CAPABILITY: Record<UploadPurpose, Capability> = {
  product: "products.manage",
  category: "categories.manage",
  banner: "content.manage",
  logo: "appearance.manage",
  favicon: "appearance.manage",
  review: "reviews.manage",
};

/**
 * Image upload (multipart form: file + purpose).
 * - MIME/size validated server-side (lib/storage).
 * - SVG sanitized (no scripts/external refs).
 * - Stored under stores/{store_id}/{purpose}/ in the PUBLIC bucket
 *   (storefronts are public; bucket is readable without auth).
 * - Only a public URL is returned — never a path with credentials.
 */
export async function POST(req: Request) {
  try {
    const ctx = await getMerchantContext();

    const form = await req.formData();
    const purpose = (form.get("purpose") ?? "product") as UploadPurpose;
    if (!PURPOSE_CAPABILITY[purpose]) throw err("VALIDATION", "Usage de fichier invalide");
    requireCapability(ctx, PURPOSE_CAPABILITY[purpose]);

    const file = form.get("file");
    if (!(file instanceof File)) throw err("VALIDATION", "Aucun fichier reçu");

    const buffer = Buffer.from(await file.arrayBuffer());
    const validation = validateUpload(buffer, file.type, purpose);
    if (!validation.ok) throw err("VALIDATION", validation.error ?? "Fichier invalide");

    const ext = file.name.split(".").pop()?.toLowerCase() ?? (validation.isSvg ? "svg" : "png");
    const safeName = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const path = storagePath(ctx.store.id, purpose, safeName);

    const admin = getAdminSupabase();
    const uploadBody = validation.isSvg && validation.sanitizedSvg ? validation.sanitizedSvg : buffer;
    const { error } = await admin.storage
      .from(STORAGE_BUCKET)
      .upload(path, uploadBody, {
        contentType: validation.isSvg ? "image/svg+xml" : file.type || "image/png",
        upsert: false,
      });
    if (error) {
      console.error("[flexigo:upload] storage error:", error.message);
      throw err("INTEGRATION_ERROR", "Stockage non disponible. Vérifiez que le bucket « fx-storefront » existe.");
    }

    const { data: pub } = admin.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    const url = pub.publicUrl;

    return Response.json({
      ok: true,
      url,
      warnings: validation.warnings,
      dimensions: validation.dimensions,
    });
  } catch (e) {
    return toErrorResponse(e);
  }
}
