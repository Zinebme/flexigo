import { getAdminSupabase } from "@/lib/supabase/admin";
import { err } from "@/lib/errors";

export async function validateProductLinks(storeId: string, categoryId: string | null | undefined, links: string[]) {
  const admin = getAdminSupabase();
  if (categoryId !== undefined) {
    if (!categoryId) throw err("VALIDATION", "Choisissez une catégorie avant d’enregistrer le produit.");
    const { data, error } = await admin.from("categories").select("id").eq("store_id", storeId).eq("id", categoryId).maybeSingle();
    if (error) throw error;
    if (!data) throw err("VALIDATION", "Catégorie introuvable dans cette boutique.");
  }
  const ids = [...new Set(links)];
  if (!ids.length) return;
  const { data, error } = await admin.from("products").select("id").eq("store_id", storeId).is("deleted_at", null).in("id", ids);
  if (error) throw error;
  const owned = new Set((data ?? []).map((row) => row.id));
  if (ids.some((id) => !owned.has(id))) throw err("VALIDATION", "Produit associé invalide pour cette boutique.");
}
