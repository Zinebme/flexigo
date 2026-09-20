import { getAdminContext } from "@/lib/auth/admin-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { validateUpload, type UploadPurpose } from "@/lib/storage";
import { toErrorResponse, err } from "@/lib/errors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const STORAGE_BUCKET = "store-assets";
const ADMIN_PURPOSES = new Set<UploadPurpose>(["product", "category", "banner", "logo", "favicon"]);

export async function POST(req: Request) {
  try {
    const ctx = await getAdminContext();
    const form = await req.formData();
    const purpose = String(form.get("purpose") ?? "product") as UploadPurpose;
    if (!ADMIN_PURPOSES.has(purpose)) throw err("VALIDATION", "Usage de fichier invalide");

    const file = form.get("file");
    if (!(file instanceof File)) throw err("VALIDATION", "Aucun fichier reçu");

    const buffer = Buffer.from(await file.arrayBuffer());
    const validation = validateUpload(buffer, file.type, purpose);
    if (!validation.ok) throw err("VALIDATION", validation.error ?? "Fichier invalide");

    const ext = file.name.split(".").pop()?.toLowerCase() ?? (validation.isSvg ? "svg" : "png");
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 60);
    const name = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}-${safe || `image.${ext}`}`;
    // Admin-only staging is intentional: the final URL is copied into the
    // newly-created store content. No client session can write here.
    const path = `admin-staging/${ctx.user.id}/${purpose}/${name}`;

    const admin = getAdminSupabase();
    const uploadBody = validation.isSvg && validation.sanitizedSvg ? validation.sanitizedSvg : buffer;
    const { error } = await admin.storage.from(STORAGE_BUCKET).upload(path, uploadBody, {
      contentType: validation.isSvg ? "image/svg+xml" : file.type || "image/png",
      upsert: false,
    });
    if (error) throw err("INTEGRATION_ERROR", "Téléversement impossible. Vérifiez le bucket store-assets.");

    const { data } = admin.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    return Response.json({ ok: true, url: data.publicUrl, warnings: validation.warnings, dimensions: validation.dimensions });
  } catch (e) {
    return toErrorResponse(e);
  }
}
