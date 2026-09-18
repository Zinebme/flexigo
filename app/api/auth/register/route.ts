import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSupabase } from "../../../../lib/supabase/server";
import { toErrorResponse } from "../../../../lib/errors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const body = z.object({
  full_name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(200),
  password: z
    .string()
    .min(10, "Le mot de passe doit contenir au moins 10 caractères.")
    .max(200),
});

export async function POST(req: NextRequest) {
  try {
    const parsed = body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json({ error: first?.message ?? "Formulaire invalide." }, { status: 400 });
    }
    const { full_name, email, password } = parsed.data;

    const supabase = await getServerSupabase();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name } },
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // If email confirmation is disabled in Supabase, the session is immediate.
    const needsConfirmation = !data.session;
    return NextResponse.json({
      ok: true,
      needs_confirmation: needsConfirmation,
      message: needsConfirmation
        ? "Compte créé. Vérifiez votre boîte mail pour confirmer votre adresse, puis connectez-vous."
        : "Compte créé.",
    });
  } catch (e) {
    return toErrorResponse(e);
  }
}
