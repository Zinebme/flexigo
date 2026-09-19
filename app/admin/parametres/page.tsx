import { getAdminContext } from "@/lib/auth/admin-context";
import { PageHeader, Card } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AdminParametresPage() {
  await getAdminContext();

  return (
    <>
      <PageHeader title="Paramètres plateforme" subtitle="Configuration globale, variables d'environnement, sécurité." />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-bold text-slate-900">Variables d'environnement requises</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li><code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> — URL Supabase</li>
            <li><code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> — anon key (client)</li>
            <li><code className="font-mono">Clé service Supabase</code> — serveur uniquement, jamais exposée au navigateur ni commitée</li>
            <li><code className="font-mono">CREDENTIALS_ENCRYPTION_KEY</code> — clé dédiée pour chiffrer les credentials externes (fxenc1.*)</li>
            <li><code className="font-mono">NEXT_PUBLIC_APP_URL</code> — ex: https://flexigo.com</li>
          </ul>
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            Ne jamais commiter <code>.env.local</code> ni exposer <code>service_role</code> côté navigateur.
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-bold text-slate-900">Sécurité — contrôles actifs</h3>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
            <li>RLS sur toutes les tables tenant (membership-based, recursion-safe, documenté dans migrations 0011).</li>
            <li>IDOR prévention: toute lecture/écriture vérifie store_id via membership ou service_role audité.</li>
            <li>service_role jamais client-side, jamais NEXT_PUBLIC_.</li>
            <li>Opérations privilégiées server-side uniquement (fn_create_store, fn_publish_page, etc.).</li>
            <li>Zod partout, recalcul server-side des totaux (jamais confiance au browser).</li>
            <li>Audit logs: actor, tenant, action, entity, safe before/after, pas de secrets.</li>
            <li>Rate limits checkout (10/10min IP) + honeypot + détection doublons + validation téléphone DZ.</li>
            <li>Upload validation (MIME/size, signed URLs, bucket public pour images produits).</li>
            <li>CSP + security headers dans next.config + proxy.ts.</li>
            <li>Secrets chiffrés (AES-256-GCM, prefix fxenc1.*).</li>
            <li>Soft deletion, confirmations UI, re-auth pour ops critiques super-admin.</li>
            <li>Support impersonation: silent pour client, 100% loggé interne, bannière + quit.</li>
            <li>Pas de raw SQL editor.</li>
          </ul>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h3 className="font-bold text-slate-900">Setup initial super admin</h3>
          <div className="mt-3 rounded-lg bg-slate-900 p-4 font-mono text-xs text-slate-100">
            <div># 1. Créer un compte via /register ou supabase auth</div>
            <div># 2. Dans Supabase SQL editor (service_role):</div>
            <div className="mt-2 text-emerald-300">insert into platform_admins (user_id, role) values (&apos;&lt;uuid&gt;&apos;, &apos;SUPER_ADMIN&apos;);</div>
            <div className="mt-2"># 3. Se connecter — /admin devient accessible</div>
            <div className="mt-2"># Seed de démo (4 stores): npm run db:seed (voir supabase/migrations/20260918000013_seed_templates.sql)</div>
          </div>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h3 className="font-bold text-slate-900">Déploiement</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-3 text-sm">
            <div className="rounded-lg border border-slate-200 p-3">
              <div className="font-semibold">Vercel</div>
              <div className="mt-1 text-xs text-slate-500">Build Next.js standalone. Env vars dans dashboard Vercel. Domaines: ajout CNAME + vérif.</div>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <div className="font-semibold">Hostinger VPS</div>
              <div className="mt-1 text-xs text-slate-500">Dockerfile + docker-compose fournis. Traefik/Nginx proxy hostname → container. Preview via /s/[slug].</div>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <div className="font-semibold">Docker</div>
              <div className="mt-1 text-xs text-slate-500"><code>docker compose up --build</code> — voir Dockerfile, .env.example, scripts/local-db.sh</div>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
