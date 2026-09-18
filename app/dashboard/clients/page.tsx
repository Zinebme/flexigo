import { Suspense } from "react";
import { getMerchantContext } from "@/lib/auth/merchant-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { can } from "@/lib/types";
import { formatDA, formatDateFr } from "@/lib/utils";
import { PageHeader, Card, Table, Th, Td, Badge, EmptyState } from "@/components/ui";
import { CustomerSearch } from "@/components/dashboard/customer-search";
import { CustomerNoteForm } from "@/components/dashboard/customer-note-form";
import type { CustomerRow } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";

export default async function ClientsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await getMerchantContext();
  const qs = await searchParams;
  const q = (Array.isArray(qs.q) ? qs.q[0] : qs.q)?.trim().toLowerCase();

  const admin = getAdminSupabase();
  const { data: customers } = await admin
    .from("customers")
    .select("*")
    .eq("store_id", ctx.store.id)
    .is("deleted_at", null)
    .order("last_order_at", { ascending: false, nullsFirst: false });

  let list = (customers ?? []) as CustomerRow[];
  if (q) {
    list = list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.normalized_phone.includes(q) ||
        (c.email ?? "").toLowerCase().includes(q),
    );
  }

  const canEdit = can(ctx.role, "customers.manage");

  return (
    <>
      <PageHeader title="Clients" subtitle={`${list.length} clients (identifiés par téléphone normalisé, propres à ce site).`} />
      <Suspense>
        <CustomerSearch />
      </Suspense>

      <Card className="mt-4">
        {list.length === 0 ? (
          <EmptyState icon="👥" title="Aucun client" text="Les clients apparaissent automatiquement avec leurs premières commandes." />
        ) : (
          <Table
            head={
              <>
                <Th>Client</Th>
                <Th>Téléphone</Th>
                <Th>Email</Th>
                <Th>Commandes</Th>
                <Th>Volume</Th>
                <Th>Dernière commande</Th>
              </>
            }
          >
            {list.map((c) => (
              <tr key={c.id} className="align-top transition hover:bg-slate-50">
                <Td className="font-medium text-slate-800">{c.name}</Td>
                <Td>
                  <a className="text-blue-600" href={`tel:+${c.phone.replace(/[^0-9]/g, "")}`}>{c.phone}</a>
                  <div className="text-xs text-slate-400">{c.normalized_phone}</div>
                </Td>
                <Td className="text-slate-600">{c.email ?? "—"}</Td>
                <Td>
                  <Badge tone="blue">{c.order_count}</Badge>
                </Td>
                <Td className="font-semibold text-slate-900">{formatDA(c.total_spent_cents)}</Td>
                <Td className="text-slate-500">{c.last_order_at ? formatDateFr(c.last_order_at) : "—"}</Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      {canEdit && (
        <Card className="mt-4">
          <div className="mb-2 px-5 pt-4 text-sm font-semibold text-slate-700">Notes internes par client</div>
          <div className="space-y-4">
            {list.slice(0, 20).map((c) => (
              <CustomerNoteForm
                key={c.id}
                customerId={c.id}
                initialEmail={c.email ?? ""}
                initialNotes={c.notes ?? ""}
              />
            ))}
            {list.length > 20 && (
              <p className="text-sm text-slate-400">Affichage des 20 clients les plus actifs — recherchez les autres ci-dessus.</p>
            )}
          </div>
        </Card>
      )}
    </>
  );
}
