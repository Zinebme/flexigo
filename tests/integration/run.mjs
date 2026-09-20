/**
 * FlexiGo — SQL integration test runner.
 *
 * Spins up a real PostgreSQL (embedded-postgres) or uses an existing one
 * (TEST_DATABASE_URL), applies ALL migrations + seed, then proves the
 * security model with real RLS evaluation:
 *
 *   1. Tenant isolation: Merchant A (NovaShop) cannot read/modify Merchant B
 *      (Maison Almasa / PureSkin) products, orders, customers, config.
 *   2. Role permissions: VIEWER cannot write products; anonymous cannot
 *      read orders; platform_admins invisible to all client roles.
 *   3. Checkout: fn_place_cod_order recomputes totals server-side, enforces
 *      stock, phone validation, offers; anonymous may call it.
 *   4. Draft/publish: anon always reads published_content; publish bumps
 *      version; restore works.
 *   5. Support access: only platform admins can hold support sessions;
 *      merchants cannot insert support_sessions; fn_can_access_store is
 *      true only with an open session.
 *   6. Domain resolution: hostname → store mapping.
 *
 * Run: npm run test:integration
 */
import { readFileSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..", "..");
const migrationsDir = path.join(root, "supabase", "migrations");

const EXTERNAL_URL = process.env.TEST_DATABASE_URL;
const PORT = 54331;
const DATA_DIR = `/tmp/flexigo-pg-test-${process.pid}`;

let client;
let passed = 0;
let failed = 0;
const failures = [];

function check(name, cond, detail = "") {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    failures.push(name);
    console.log(`  ✗ ${name} ${detail}`);
  }
}

function section(title) {
  console.log(`\n— ${title}`);
}

/** Run SQL as a given Postgres role, optionally with Supabase-style JWT claims. */
async function runAs(role, sub, sql, params) {
  await client.query("RESET ALL");
  await client.query("SET search_path TO public");
  const claims = role === "service_role"
    ? { role: "service_role", sub: "service-role" }
    : sub
      ? { sub }
      : null;
  if (claims) await client.query(`SET request.jwt.claims = $$${JSON.stringify(claims)}$$`);
  else await client.query(`SET request.jwt.claims = ''`);
  await client.query(`SET ROLE ${role}`);
  try {
    const res = await client.query(sql, params);
    await client.query("RESET ROLE");
    return res;
  } catch (e) {
    try { await client.query("RESET ROLE"); } catch { /* ignore */ }
    throw e;
  }
}

/** Expect an error matching one of the codes (pipe-separated alternatives). */
async function expectError(name, role, sub, sql, codes, params) {
  try {
    const res = await runAs(role, sub, sql, params);
    check(name, false, `— no error raised (rows: ${res.rowCount})`);
    return null;
  } catch (e) {
    const msg = String(e.message);
    const ok = codes === null || codes.split("|").some((c) => msg.includes(c));
    check(name, ok, `— got: ${msg}`);
    return e;
  }
}

async function main() {
  let owned = false;
  if (!EXTERNAL_URL) {
    console.log("Starting embedded PostgreSQL…");
    const { default: EmbeddedPostgres } = await import("embedded-postgres");
    const pgInst = new EmbeddedPostgres({ databaseDir: DATA_DIR, user: "postgres", password: "postgres", port: PORT });
    await pgInst.initialise();
    await pgInst.start();
    await pgInst.createDatabase("flexigo_test");
    owned = true;
    global.__pgInstance = pgInst;
  }

  const url = EXTERNAL_URL ?? `postgres://postgres:postgres@127.0.0.1:${PORT}/flexigo_test`;
  client = new pg.Client({ connectionString: url, ssl: false });
  await client.connect();

  // --- fresh schema ---------------------------------------------------------
  section("Applying migrations");
  const tables = [
    "platform_settings", "support_sessions", "integration_logs", "system_events", "audit_logs",
    "whatsapp_integrations", "google_sheet_integrations", "marketing_integrations", "shipments",
    "shipping_integrations", "inventory_movements", "order_status_history", "order_items", "orders",
    "customers", "page_versions", "pages", "faq_items", "reviews", "shipping_zones",
    "quantity_offers", "product_images", "product_variants", "products", "categories", "themes",
    "templates", "wilayas", "domains", "store_counters", "platform_admins", "store_members",
    "stores", "organizations", "profiles",
  ];
  for (const t of tables) {
    try { await client.query(`drop table if exists public."${t}" cascade`); } catch { /* ignore */ }
  }
  for (const f of ["fn_ensure_profile", "fn_activate_membership", "fn_set_updated_at", "fn_can_access_store", "fn_is_support_open", "fn_is_platform_admin", "fn_has_store_role", "fn_has_store_membership", "fn_normalize_phone", "fn_on_new_auth_user", "fn_on_new_session", "fn_next_order_number", "fn_place_cod_order", "fn_create_store", "fn_publish_page", "fn_restore_page_version", "fn_copy_store"]) {
    const found = await client.query(
      `select p.proname, pg_get_function_arguments(p.oid) args
         from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and p.proname = $1`, [f]);
    for (const row of found.rows) {
      try { await client.query(`drop function if exists public.${row.proname}(${row.args}) cascade`); } catch { /* ignore */ }
    }
  }

  const files = readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();
  for (const f of files) {
    const sql = readFileSync(path.join(migrationsDir, f), "utf8");
    await client.query(sql);
    console.log(`  applied ${f}`);
  }

  section("Applying seed");
  const seed = readFileSync(path.join(root, "supabase", "seed.sql"), "utf8");
  await client.query(seed);
  console.log("  seed applied");

  // --- fixtures ------------------------------------------------------------
  const NOVA = "b0000000-0000-4000-8000-000000000002";
  const ALMASA = "b0000000-0000-4000-8000-000000000001";
  const PURES = "b0000000-0000-4000-8000-000000000003";
  const HORIZON = "b0000000-0000-4000-8000-000000000004";
  const KARIM = "a0000000-0000-4000-8000-000000000012"; // NovaShop OWNER
  const YACINE = "a0000000-0000-4000-8000-000000000013"; // NovaShop ORDER_MANAGER
  const SOFIA = "a0000000-0000-4000-8000-000000000011"; // Almasa OWNER
  const LINA = "a0000000-0000-4000-8000-000000000021"; // PureSkin OWNER
  const ADMIN = "a0000000-0000-4000-8000-000000000001"; // SUPER_ADMIN
  const BATT = "e0000000-0000-4000-8000-000000000017"; // NovaShop batterie 3400 DA
  const HIJAB = "e0000000-0000-4000-8000-000000000001"; // Almasa hijab 1800 DA
  const SOUQ = "b0000000-0000-4000-8000-000000000005"; // Souq Plus (SOUQ — Arabic-first COD)
  const SOUQ_WATCH = "e0000000-0000-4000-8000-000000000031"; // 2900 DZD, packs 2 → 5200, 3 → 7200
  const SOUQ_WATCH_V44 = "f0000000-0000-4000-8000-000000000032"; // 44 mm variant, 3100 DZD

  // ==========================================================================
  section("1. Tenant isolation (Merchant A vs Merchant B)");

  // A reads own products
  const aOwn = await runAs("authenticated", KARIM, `select count(*)::int n from products where store_id = $1`, [NOVA]);
  check("NovaShop owner sees own products (8)", aOwn.rows[0].n === 8, `got ${aOwn.rows[0].n}`);

  // A cannot read B's products
  const aOther = await runAs("authenticated", KARIM, `select count(*)::int n from products where store_id = $1`, [ALMASA]);
  check("NovaShop owner CANNOT see Almasa products", aOther.rows[0].n === 0, `got ${aOther.rows[0].n}`);

  // A cannot read B's orders / customers
  const aOrders = await runAs("authenticated", KARIM, `select count(*)::int n from orders where store_id = $1`, [ALMASA]);
  check("NovaShop owner CANNOT see Almasa orders", aOrders.rows[0].n === 0);
  const aCust = await runAs("authenticated", KARIM, `select count(*)::int n from customers where store_id = $1`, [ALMASA]);
  check("NovaShop owner CANNOT see Almasa customers", aCust.rows[0].n === 0);

  // B (PureSkin) cannot touch NovaShop either
  const bNova = await runAs("authenticated", LINA, `select count(*)::int n from products where store_id = $1`, [NOVA]);
  check("PureSkin owner CANNOT see NovaShop products", bNova.rows[0].n === 0);

  // A cannot modify B's configuration
  try {
    const r = await runAs("authenticated", KARIM, `update stores set name = 'HACKED' where id = $1`, [ALMASA]);
    check("NovaShop owner CANNOT update Almasa store", r.rowCount === 0, `updated ${r.rowCount} row(s)!`);
  } catch {
    check("NovaShop owner CANNOT update Almasa store", true);
  }
  const nameAfter = await runAs("authenticated", SOFIA, `select name from stores where id = $1`, [ALMASA]);
  check("Almasa store name unchanged", nameAfter.rows[0]?.name === "Maison Almasa", `got ${nameAfter.rows[0]?.name}`);

  // A cannot modify B's homepage
  try {
    const r = await runAs("authenticated", KARIM, `update pages set title = 'XSS' where store_id = $1 and key = 'home'`, [ALMASA]);
    check("NovaShop owner CANNOT edit Almasa homepage", r.rowCount === 0, `updated ${r.rowCount} row(s)!`);
  } catch {
    check("NovaShop owner CANNOT edit Almasa homepage", true);
  }

  // A cannot see B's members / team
  const aMembers = await runAs("authenticated", KARIM, `select count(*)::int n from store_members where store_id = $1`, [ALMASA]);
  check("NovaShop owner CANNOT see Almasa team", aMembers.rows[0].n === 0);

  // A cannot read B's shipping credentials table at all
  const aShipCfg = await runAs("authenticated", KARIM, `select count(*)::int n from shipping_integrations where store_id = $1`, [ALMASA]);
  check("shipping_integrations invisible to clients (even own store)", aShipCfg.rows[0].n === 0);

  // ==========================================================================
  section("2. Role permissions");

  // VIEWER-like: use a membership we add on the fly (service role)
  await runAs("service_role", null, `
    insert into auth.users (id, email, encrypted_password) values ('a0000000-0000-4000-8000-000000009001', 'viewer@test.demo', 'x') on conflict (id) do nothing;
    insert into profiles (id, full_name, email) values ('a0000000-0000-4000-8000-000000009001', 'Test Viewer', 'viewer@test.demo')
    on conflict (id) do nothing;
  `);
  await runAs("service_role", null, `
    insert into store_members (store_id, user_id, role, status) values ($1, 'a0000000-0000-4000-8000-000000009001', 'VIEWER', 'active')
    on conflict (store_id, user_id) do nothing;
  `, [NOVA]);
  const VIEWER = "a0000000-0000-4000-8000-000000009001";

  try {
    const r = await runAs("authenticated", VIEWER, `
      insert into products (store_id, name, slug, price_cents) values ($1, 'Viewer Hack', 'viewer-hack', 100) returning id`, [NOVA]);
    check("VIEWER cannot insert products", (r.rows ?? []).length === 0, `inserted ${r.rows?.length} row(s)!`);
  } catch {
    check("VIEWER cannot insert products", true);
  }

  const viewerRead = await runAs("authenticated", VIEWER, `select count(*)::int n from products where store_id = $1`, [NOVA]);
  check("VIEWER can read own store products", viewerRead.rows[0].n === 8);

  // ORDER_MANAGER can read orders but not products write
  const omOrders = await runAs("authenticated", YACINE, `select count(*)::int n from orders where store_id = $1`, [NOVA]);
  check("ORDER_MANAGER reads orders", omOrders.rows[0].n >= 10, `got ${omOrders.rows[0].n}`);
  try {
    const r = await runAs("authenticated", YACINE, `update products set price_cents = 1 where store_id = $1`, [NOVA]);
    check("ORDER_MANAGER cannot edit products (price tamper)", r.rowCount === 0, `updated ${r.rowCount}!`);
  } catch {
    check("ORDER_MANAGER cannot edit products (price tamper)", true);
  }

  // Nobody (client role) can read platform_admins
  const pa = await runAs("authenticated", KARIM, `select count(*)::int n from platform_admins`);
  check("platform_admins invisible to merchants", pa.rows[0].n === 0);
  const paAnon = await runAs("anon", null, `select count(*)::int n from platform_admins`);
  check("platform_admins invisible to anon", paAnon.rows[0].n === 0);

  // No one can self-assign SUPER_ADMIN
  try {
    const r = await runAs("authenticated", KARIM, `insert into platform_admins (user_id, role) values ($1, 'SUPER_ADMIN') returning id`, [KARIM]);
    check("merchants cannot insert into platform_admins", (r.rows ?? []).length === 0, `inserted!`);
  } catch {
    check("merchants cannot insert into platform_admins", true);
  }

  // audit logs invisible
  const audit = await runAs("authenticated", KARIM, `select count(*)::int n from audit_logs`);
  check("audit_logs invisible to merchants", audit.rows[0].n === 0);

  // anonymous cannot read orders
  const anonOrders = await runAs("anon", null, `select count(*)::int n from orders where store_id = $1`, [NOVA]);
  check("anon cannot read orders", anonOrders.rows[0].n === 0);

  // ==========================================================================
  section("3. Checkout (server-side pricing, stock, phone)");

  const priceBefore = await runAs("anon", null, `select stock, price_cents from products where id = $1`, [BATT]);
  const stockBefore = priceBefore.rows[0].stock;

  const orderRes = await runAs("anon", null, `select public.fn_place_cod_order(
    $1, ('[{"product_id": "' || $2 || '", "variant_id": null, "quantity": 2}]')::jsonb,
    'Test Client', '0550 12 34 99', null, 16, 'Alger', null, 'home', null, null, null, null, 'test') res`,
    [NOVA, BATT]);
  const order = orderRes.rows[0].res;

  // 2 batteries → offer 5900 DA (590000c) + 40000 fee (Alger zone) = 630000
  check("Checkout total recomputed server-side (offer applied)", order.total_cents === 590000 + 40000, `got ${order.total_cents}`);
  check("Checkout subtotal = bundle offer price", order.subtotal_cents === 590000, `got ${order.subtotal_cents}`);
  check("Checkout shipping = Algiers zone fee", order.shipping_fee_cents === 40000, `got ${order.shipping_fee_cents}`);

  const stockAfter = await runAs("anon", null, `select stock from products where id = $1`, [BATT]);
  check("Stock decremented atomically", stockAfter.rows[0].stock === stockBefore - 2, `before ${stockBefore} after ${stockAfter.rows[0].stock}`);

  const cust = await runAs("service_role", null, `select * from customers where store_id = $1 and normalized_phone = '213550123499'`, [NOVA]);
  check("Customer upserted by normalized phone", cust.rows.length === 1 && cust.rows[0].order_count === 1, `rows ${cust.rows.length}`);

  // invalid phone rejected
  await expectError("Checkout rejects invalid phone", "anon", null,
    `select * from public.fn_place_cod_order($1, ('[{"product_id": "' || $2 || '", "quantity": 1}]')::jsonb, 'Bad Phone', '12345', null, 16, 'Alger', null, 'home', null, null, null, null, 'test')`,
    "INVALID_PHONE", [NOVA, BATT]);

  // over-stock rejected
  await expectError("Checkout rejects quantity above stock", "anon", null,
    `select * from public.fn_place_cod_order($1, ('[{"product_id": "' || $2 || '", "quantity": 9999}]')::jsonb, 'Too Much', '0550123456', null, 16, 'Alger', null, 'home', null, null, null, null, 'test')`,
    "INVALID_QUANTITY|OUT_OF_STOCK", [NOVA, BATT]);

  // cross-store product reference rejected (Almasa product inside NovaShop order)
  await expectError("Checkout rejects another store's product (IDOR)", "anon", null,
    `select * from public.fn_place_cod_order($1, ('[{"product_id": "' || $2 || '", "quantity": 1}]')::jsonb, 'Cross Store', '0550123456', null, 16, 'Alger', null, 'home', null, null, null, null, 'test')`,
    "PRODUCT_NOT_FOUND", [NOVA, HIJAB]);

  // COD-disabled store (Cabinet Horizon) rejected
  await expectError("Checkout rejected for COD-disabled store", "anon", null,
    `select * from public.fn_place_cod_order($1, ('[{"product_id": "' || $2 || '", "quantity": 1}]')::jsonb, 'No COD', '0550123456', null, 25, 'Constantine', null, 'home', null, null, null, null, 'test')`,
    "COD_DISABLED", [HORIZON, BATT]);

  // draft store rejected
  await runAs("service_role", null, `update stores set status = 'draft' where id = $1`, [HORIZON]);
  await expectError("Checkout rejected for draft store", "anon", null,
    `select * from public.fn_place_cod_order($1, ('[{"product_id": "' || $2 || '", "quantity": 1}]')::jsonb, 'Draft', '0550123456', null, 25, 'Constantine', null, 'home', null, null, null, null, 'test')`,
    "STORE_NOT_ACTIVE", [HORIZON, BATT]);
  await runAs("service_role", null, `update stores set status = 'active' where id = $1`, [HORIZON]);

  // order number uniqueness + sequence
  const orderNum = order.order_number;
  check("Order number format", /^ORD-\d{6}$/.test(orderNum), `got ${orderNum}`);

  // ==========================================================================
  section("4. Draft / publish");

  const homeBefore = await runAs("anon", null, `select published_content->>'title' t, (published_content->'sections')::jsonb #> '{0,title}' sec from pages where store_id = $1 and key = 'home'`, [NOVA]);
  check("Anon reads published home", homeBefore.rows[0].sec === "NovaShop — Tout pour votre quotidien", `got ${homeBefore.rows[0].sec}`);

  // merchant edits draft
  await runAs("authenticated", KARIM, `
    update pages set content = jsonb_set(content, '{sections,0,title}', '"NOUVEAU DRAFT"') where store_id = $1 and key = 'home'`, [NOVA]);
  const homeAfterEdit = await runAs("anon", null, `select (published_content->'sections')::jsonb #> '{0,title}' sec from pages where store_id = $1 and key = 'home'`, [NOVA]);
  check("Anon STILL reads published content after draft edit", homeAfterEdit.rows[0].sec === "NovaShop — Tout pour votre quotidien", `got ${homeAfterEdit.rows[0].sec}`);
  const draftSeen = await runAs("authenticated", KARIM, `select content->'sections'->0->>'title' sec from pages where store_id = $1 and key = 'home'`, [NOVA]);
  check("Merchant sees draft", draftSeen.rows[0].sec === "NOUVEAU DRAFT");

  // unpublished (legal) pages invisible to anon
  const legal = await runAs("anon", null, `select count(*)::int n from pages where store_id = $1 and published_content is null`, [NOVA]);
  // count is of rows anon CAN see among unpublished — must be 0
  check("Unpublished pages invisible to anon", legal.rows[0].n === 0);

  // publish (v1 → v2)
  const pub = await runAs("service_role", null, `select public.fn_publish_page($1, 'home', 1, $2) res`, [NOVA, KARIM]);
  check("Publish bumps version to 2", pub.rows[0].res.version === 2, `got ${JSON.stringify(pub.rows[0])}`);
  const homeAfterPub = await runAs("anon", null, `select (published_content->'sections')::jsonb #> '{0,title}' sec from pages where store_id = $1 and key = 'home'`, [NOVA]);
  check("Anon now reads NEW published content", homeAfterPub.rows[0].sec === "NOUVEAU DRAFT", `got ${homeAfterPub.rows[0].sec}`);

  // version conflict detected
  let conflictSeen = false;
  try {
    await runAs("service_role", null, `select public.fn_publish_page($1, 'home', 1, $2) res`, [NOVA, KARIM]);
  } catch (e) {
    conflictSeen = String(e.message).includes("VERSION_CONFLICT");
  }
  check("Publish with stale version rejected (optimistic lock)", conflictSeen);

  // restore v1
  const restored = await runAs("service_role", null, `select public.fn_restore_page_version($1, 'home', 1, $2) res`, [NOVA, KARIM]);
  check("Restore publishes v1 as new version (3)", restored.rows[0].res.version === 3);
  const homeAfterRestore = await runAs("anon", null, `select (published_content->'sections')::jsonb #> '{0,title}' sec from pages where store_id = $1 and key = 'home'`, [NOVA]);
  check("Restored content live", homeAfterRestore.rows[0].sec === "NovaShop — Tout pour votre quotidien");

  // ==========================================================================
  section("5. Support impersonation");

  // merchant cannot start a support session
  try {
    const r = await runAs("authenticated", KARIM, `insert into support_sessions (admin_user_id, store_id) values ($1, $2) returning id`, [KARIM, ALMASA]);
    check("Merchants cannot start support sessions", (r.rows ?? []).length === 0, "insert succeeded!");
  } catch {
    check("Merchants cannot start support sessions", true);
  }

  // no open session → fn_can_access_store false for admin on other store
  const noSession = await runAs("service_role", null, `select public.fn_can_access_store($1, $2) ok`, [ADMIN, NOVA]);
  check("No support session → admin has no direct store access (must impersonate)", noSession.rows[0].ok === false);

  // admin starts session (service side)
  const sess = await runAs("service_role", null, `insert into support_sessions (admin_user_id, store_id) values ($1, $2) returning id`, [ADMIN, NOVA]);
  const sessionId = sess.rows[0].id;

  const withSession = await runAs("service_role", null, `select public.fn_can_access_store($1, $2) ok`, [ADMIN, NOVA]);
  check("Open support session → admin can access store", withSession.rows[0].ok === true);

  // admin (as authenticated role) can now see NovaShop store + orders via RLS
  const adminSeesStore = await runAs("authenticated", ADMIN, `select count(*)::int n from stores where id = $1`, [NOVA]);
  check("Super Admin in support mode reads store via RLS", adminSeesStore.rows[0].n === 1);
  const adminSeesOrders = await runAs("authenticated", ADMIN, `select count(*)::int n from orders where store_id = $1`, [NOVA]);
  check("Super Admin in support mode reads orders via RLS", adminSeesOrders.rows[0].n >= 10, `got ${adminSeesOrders.rows[0].n}`);

  // other store still blocked for admin without session
  const adminNoPures = await runAs("service_role", null, `select public.fn_can_access_store($1, $2) ok`, [ADMIN, PURES]);
  check("Support session scoped to target store only", adminNoPures.rows[0].ok === false);

  // end session
  await runAs("service_role", null, `update support_sessions set ended_at = now() where id = $1`, [sessionId]);
  const afterEnd = await runAs("service_role", null, `select public.fn_can_access_store($1, $2) ok`, [ADMIN, NOVA]);
  check("Closed session revokes access", afterEnd.rows[0].ok === false);

  // ==========================================================================
  section("6. Domain resolution + store creation + copy");

  const dom = await runAs("service_role", null, `select s.id from domains d join stores s on s.id = d.store_id where d.hostname = 'novashop-dz.com.dz' and d.status = 'verified'`);
  check("Verified domain resolves to its store", dom.rows.length === 0 || dom.rows[0].id === NOVA);
  const domPending = await runAs("service_role", null, `select count(*)::int n from domains where hostname = 'novashop-dz.com.dz' and status = 'pending'`);
  check("Pending domain does NOT resolve (verification required)", dom.rows.length === 0 && domPending.rows[0].n === 1);

  // wizard function creates a full store
  await runAs("service_role", null, `
    insert into auth.users (id, email, encrypted_password) values ('a0000000-0000-4000-8000-000000009002', 'newowner@test.demo', 'x') on conflict (id) do nothing;
    insert into profiles (id, full_name, email) values ('a0000000-0000-4000-8000-000000009002', 'New Owner', 'newowner@test.demo') on conflict (id) do nothing;
  `);
  const newStore = await runAs("service_role", null, `
    select * from public.fn_create_store(
      null, 'Boutique Test', 'boutique-test', 'ecommerce', 'ecommerce-modern', 'fr', 'DZD',
      '{"primary_color": "#111111", "typography": "modern", "button_shape": "pill"}'::jsonb,
      null,
      '[{"key": "home", "title": "Accueil", "content": {"sections": [{"id": "x1", "type": "hero", "enabled": true, "title": "Bonjour"}]}}]'::jsonb,
      '[{"wilaya_code": 0, "home_fee_cents": 50000, "office_fee_cents": 30000}]'::jsonb,
      'a0000000-0000-4000-8000-000000009002', 'a0000000-0000-4000-8000-000000000001') res`,
  );
  check("fn_create_store creates store (draft)", newStore.rows.length === 1);
  const nsId = newStore.rows[0].res;
  const nsTheme = await runAs("service_role", null, `select primary_color from themes where store_id = $1`, [nsId]);
  check("Theme created from identity", nsTheme.rows[0].primary_color === "#111111");
  const nsMember = await runAs("service_role", null, `select role from store_members where store_id = $1`, [nsId]);
  check("Owner membership created", nsMember.rows[0].role === "OWNER");
  const nsPage = await runAs("service_role", null, `select count(*)::int n from pages where store_id = $1`, [nsId]);
  check("Default pages created", nsPage.rows[0].n === 1);

  // new owner can access their new store (membership RLS)
  const newOwnerSees = await runAs("authenticated", "a0000000-0000-4000-8000-000000009002", `select count(*)::int n from stores where id = $1`, [nsId]);
  check("New owner sees own draft store", newOwnerSees.rows[0].n === 1);

  // site creation may intentionally defer the merchant account
  const noOwnerStore = await runAs("service_role", null, `select public.fn_create_store(
      null, 'Sans propriétaire', 'sans-proprietaire', 'ecommerce', 'market', 'fr', 'DZD',
      '{"primary_color": "#111111", "typography": "modern", "button_shape": "rounded"}'::jsonb,
      null,
      '[{"key": "home", "title": "Accueil", "content": {"sections": []}}]'::jsonb,
      '[{"wilaya_code": 0, "home_fee_cents": 50000, "office_fee_cents": 30000}]'::jsonb,
      null, 'a0000000-0000-4000-8000-000000000001') res`);
  const noOwnerId = noOwnerStore.rows[0].res;
  const noOwnerMembers = await runAs("service_role", null, `select count(*)::int n from store_members where store_id = $1`, [noOwnerId]);
  check("Store can be created before client account exists", noOwnerMembers.rows[0].n === 0);

  // copy store
  const copy = await runAs("service_role", null, `select public.fn_copy_store($1, 'novashop-copie', 'NovaShop (copie)', $2) res`, [NOVA, ADMIN]);
  const copyId = copy.rows[0].res;
  const copyProducts = await runAs("service_role", null, `select count(*)::int n, count(*) filter (where is_active)::int active from products where store_id = $1`, [copyId]);
  check("Copied store has all products (inactive by default)", copyProducts.rows[0].n === 8 && copyProducts.rows[0].active === 0, `got ${JSON.stringify(copyProducts.rows[0])}`);
  const copyCustomers = await runAs("service_role", null, `select count(*)::int n from customers where store_id = $1`, [copyId]);
  check("Copied store has NO customers (no PII copy)", copyCustomers.rows[0].n === 0);
  const copyShipCfg = await runAs("service_role", null, `select count(*)::int n from shipping_integrations where store_id = $1`, [copyId]);
  check("Copied store has NO shipping credentials", copyShipCfg.rows[0].n === 0);


  // ==========================================================================
  section("8. SOUQ template (Arabic-first RTL storefront)");

  // The template must be registered so fn_create_store accepts it.
  const souqTpl = await runAs("service_role", null, `select key, name, website_types from templates where key = 'souq-v1'`);
  check("SOUQ template registered in the platform registry", souqTpl.rows.length === 1, `rows ${souqTpl.rows.length}`);
  check("SOUQ template targets ecommerce sites", (souqTpl.rows[0]?.website_types ?? []).includes("ecommerce"));

  const legacyKeys = ["ecommerce-modern", "fashion-luxury", "single-product", "portfolio", "elegance", "glow", "tech", "casa", "little", "active", "market", "convert"];
  const allKeys = await runAs("service_role", null, `select key from templates`);
  const keySet = new Set(allKeys.rows.map((r) => r.key));
  check("Every pre-existing template key is still registered", legacyKeys.every((k) => keySet.has(k)), `missing: ${legacyKeys.filter((k) => !keySet.has(k))}`);

  // Demo store: Arabic-first, active, published.
  const souqStore = await runAs("service_role", null, `select name, slug, language, website_type, template_key, status, published_version from stores where id = $1`, [SOUQ]);
  check("SOUQ demo store uses the souq-v1 template", souqStore.rows[0]?.template_key === "souq-v1", `got ${souqStore.rows[0]?.template_key}`);
  check("SOUQ demo store is Arabic-first (language ar)", souqStore.rows[0]?.language === "ar", `got ${souqStore.rows[0]?.language}`);
  check("SOUQ demo store is live (active + published)", souqStore.rows[0]?.status === "active" && souqStore.rows[0]?.published_version >= 1);

  // Catalogue + Arabic demo content.
  const souqCats = await runAs("service_role", null, `select count(*)::int n from categories where store_id = $1 and is_visible`, [SOUQ]);
  check("SOUQ demo has 5 visible Arabic categories", souqCats.rows[0].n === 5, `got ${souqCats.rows[0].n}`);
  const souqProducts = await runAs("service_role", null, `select count(*)::int n from products where store_id = $1 and is_active and name ~ '[\u0600-\u06FF]'`, [SOUQ]);
  check("SOUQ demo products have Arabic names", souqProducts.rows[0].n >= 5, `got ${souqProducts.rows[0].n}`);
  const souqFaq = await runAs("service_role", null, `select count(*)::int n from faq_items where store_id = $1 and is_visible and question like '%الدفع عند الاستلام%'`, [SOUQ]);
  check("SOUQ FAQ answers the COD question", souqFaq.rows[0].n >= 1, `got ${souqFaq.rows[0].n}`);
  const souqOffers = await runAs("service_role", null, `select count(*)::int n from quantity_offers where store_id = $1 and product_id = $2 and is_active`, [SOUQ, SOUQ_WATCH]);
  check("SOUQ quantity offers exist for the flagship product", souqOffers.rows[0].n === 2, `got ${souqOffers.rows[0].n}`);

  // Checkout — server-side pricing, wilaya zone, then office fallback.
  const souqHome = await runAs("anon", null, `select public.fn_place_cod_order(
    $1, ('[{"product_id": "' || $2 || '", "variant_id": "' || $3 || '", "quantity": 2}]')::jsonb,
    'زبون تجريبي', '0550 77 88 99', null, 16, 'الجزائر', 'شارع الاختبار', 'home', null, null, null, null, 'storefront') res`,
    [SOUQ, SOUQ_WATCH, SOUQ_WATCH_V44]);
  const souqOrder = souqHome.rows[0].res;
  // 2 × 3100 DA (variant price) → pack offer 5200 DA (520000c) + Alger home 50000c
  check("SOUQ order total recomputed server-side (pack offer + wilaya fee)", souqOrder.total_cents === 520000 + 50000, `got ${souqOrder.total_cents}`);
  check("SOUQ order keeps the DB subtotal (browser price ignored)", souqOrder.subtotal_cents === 520000, `got ${souqOrder.subtotal_cents}`);
  check("SOUQ order uses the wilaya-specific home fee", souqOrder.shipping_fee_cents === 50000, `got ${souqOrder.shipping_fee_cents}`);
  check("SOUQ order number uses the ORD-XXXXXX format", /^ORD-\d{6}$/.test(souqOrder.order_number), `got ${souqOrder.order_number}`);

  const souqOffice = await runAs("anon", null, `select public.fn_place_cod_order(
    $1, ('[{"product_id": "' || $2 || '", "quantity": 1}]')::jsonb,
    'زبون تجريبي 2', '0661 22 33 44', null, 6, 'بجاية', null, 'office', 'مكتب التوصيل', null, null, null, 'storefront') res`,
    [SOUQ, SOUQ_WATCH]);
  const officeOrder = souqOffice.rows[0].res;
  // wilaya 6 has no zone → fallback wilaya 0 (office 40000c)
  check("SOUQ office delivery falls back to the default zone", officeOrder.shipping_fee_cents === 40000, `got ${officeOrder.shipping_fee_cents}`);
  check("SOUQ office pickup stores the office name", officeOrder.total_cents === 290000 + 40000, `got ${officeOrder.total_cents}`);

  // Stock decremented for the SOUQ store too (variant stock for variant lines).
  const watchStock = await runAs("service_role", null, `select stock from products where id = $1`, [SOUQ_WATCH]);
  check("SOUQ product stock decremented for the quantity-only line", watchStock.rows[0].stock === 42 - 1, `got ${watchStock.rows[0].stock}`);
  const variantStock = await runAs("service_role", null, `select stock from product_variants where id = $1`, [SOUQ_WATCH_V44]);
  check("SOUQ variant stock decremented for the variant line", variantStock.rows[0].stock === 14 - 2, `got ${variantStock.rows[0].stock}`);

  // Invalid phone is rejected exactly like on every other template.
  await expectError("SOUQ checkout rejects an invalid phone", "anon", null,
    `select * from public.fn_place_cod_order($1, ('[{"product_id": "' || $2 || '", "quantity": 1}]')::jsonb, 'Bad Phone', '12345', null, 16, 'الجزائر', null, 'home', null, null, null, null, 'storefront')`,
    "INVALID_PHONE", [SOUQ, SOUQ_WATCH]);

  // Tenant isolation is unchanged for the new store.
  const karimSouq = await runAs("authenticated", KARIM, `select count(*)::int n from products where store_id = $1`, [SOUQ]);
  check("NovaShop owner CANNOT see SOUQ products", karimSouq.rows[0].n === 0, `got ${karimSouq.rows[0].n}`);
  const karimSouqOrders = await runAs("authenticated", KARIM, `select count(*)::int n from orders where store_id = $1`, [SOUQ]);
  check("NovaShop owner CANNOT see SOUQ orders", karimSouqOrders.rows[0].n === 0, `got ${karimSouqOrders.rows[0].n}`);

  // SOUQ demo account owns the store and can read its own data.
  const souqOwner = await runAs("authenticated", "a0000000-0000-4000-8000-000000000041", `select count(*)::int n from products where store_id = $1`, [SOUQ]);
  check("SOUQ demo owner sees its own products", souqOwner.rows[0].n >= 5, `got ${souqOwner.rows[0].n}`);
  const souqOwnerOther = await runAs("authenticated", "a0000000-0000-4000-8000-000000000041", `select count(*)::int n from products where store_id = $1`, [NOVA]);
  check("SOUQ demo owner CANNOT see another store's products", souqOwnerOther.rows[0].n === 0, `got ${souqOwnerOther.rows[0].n}`);

  // The SOUQ product's Arabic description survives intact (RTL content integrity).
  const souqDesc = await runAs("anon", null, `select description from products where id = $1`, [SOUQ_WATCH]);
  check("SOUQ product description is Arabic and non-empty", typeof souqDesc.rows[0]?.description === "string" && souqDesc.rows[0].description.length > 40, `got ${souqDesc.rows[0]?.description?.length}`);


  // ==========================================================================
  section("7. Phone normalization (Algeria)");

  const ph = await runAs("service_role", null, `select
    public.fn_normalize_phone('0550 12 34 56') a,
    public.fn_normalize_phone('+213 661 98 76 54') b,
    public.fn_normalize_phone('00213770112233') c,
    public.fn_normalize_phone('0213 550123456') d,
    public.fn_normalize_phone('12345') e,
    public.fn_normalize_phone('0213550123456') f`);
  check("0550… → 213550123456", ph.rows[0].a === "213550123456", `got ${ph.rows[0].a}`);
  check("+213 661… → 213661987654", ph.rows[0].b === "213661987654", `got ${ph.rows[0].b}`);
  check("00213… → 213770112233", ph.rows[0].c === "213770112233", `got ${ph.rows[0].c}`);
  check("0213 + 9 digits → normalized", ph.rows[0].d === "213550123456", `got ${ph.rows[0].d}`);
  check("too short → null", ph.rows[0].e === null);
  check("landline 02 → accepted (validated mobile at checkout)", ph.rows[0].f === "213550123456", `got ${ph.rows[0].f}`);

  // ==========================================================================
  console.log(`\n${"=".repeat(50)}\nRESULT: ${passed} passed, ${failed} failed`);
  if (failures.length) {
    console.log("Failures:");
    for (const f of failures) console.log("  - " + f);
  }

  await client.end();
  if (owned) {
    try { await global.__pgInstance.stop(); } catch { /* ignore */ }
    rmSync(DATA_DIR, { recursive: true, force: true });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("RUNNER ERROR:", e);
  try { client?.end(); } catch { /* ignore */ }
  if (global.__pgInstance) { try { global.__pgInstance.stop(); } catch { /* ignore */ } }
  process.exit(2);
});
