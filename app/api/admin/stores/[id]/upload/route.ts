import { getAdminContext } from "@/lib/auth/admin-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { validateUpload, storagePath, type UploadPurpose } from "@/lib/storage";
import { toErrorResponse, err } from "@/lib/errors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const STORAGE_BUCKET = "store-assets";
const PURPOSES = new Set<UploadPurpose>(["product","category","banner","logo","favicon","review"]);

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: storeId } = await params;
    await getAdminContext();
    const admin = getAdminSupabase();

    const { data: store } = await admin.from("stores").select("id").eq("id", storeId).is("deleted_at", null).maybeSingle();
    if (!store) throw err("NOT_FOUND", "Site introuvable");

    const form = await req.formData();
    const purpose = (form.get("purpose") ?? "banner") as UploadPurpose;
    if (!PURPOSES.has(purpose)) throw err("VALIDATION", "Usage de fichier invalide");

    const file = form.get("file");
    if (!(file instanceof File)) throw err("VALIDATION", "Aucun fichier reçu");

    const buffer = Buffer.from(await file.arrayBuffer());
    const validation = validateUpload(buffer, file.type, purpose);
    if (!validation.ok) throw err("VALIDATION", validation.error ?? "Fichier invalide");

    const ext = file.name.split(".").pop()?.toLowerCase() ?? (validation.isSvg ? "svg" : "png");
    const safeName = `${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
    const path = storagePath(storeId, purpose, safeName);
    const uploadBody = validation.isSvg && validation.sanitizedSvg ? validation.sanitizedSvg : buffer;

    const { error } = await admin.storage.from(STORAGE_BUCKET).upload(path, uploadBody, {
      contentType: validation.isSvg ? "image/svg+xml" : file.type || "image/png",
      upsert: false,
    });
    if (error) throw err("INTEGRATION_ERROR", "Téléversement impossible. Vérifiez le bucket store-assets.");

    const { data: pub } = admin.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    return Response.json({
      ok: true,
      url: pub.publicUrl,
      warnings: validation.warnings,
      dimensions: validation.dimensions,
    });
  } catch (e) {
    return toErrorResponse(e);
  }
}
