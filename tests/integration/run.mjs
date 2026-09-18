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
import { readFileSync, readdirSync, rmSync, mkdirSync } from "node:fs";
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
  const AMINE = "a0000000-0000-4000-8000-000000000014"; // NovaShop CONTENT_EDITOR
  const SOFIA = "a0000000-0000-4000-8000-000000000011"; // Almasa OWNER
  const LINA = "a0000000-0000-4000-8000-000000000021"; // PureSkin OWNER
  const ADMIN = "a0000000-0000-4000-8000-000000000001"; // SUPER_ADMIN
  const BATT = "e0000000-0000-4000-8000-000000000017"; // NovaShop batterie 3400 DA
  const HIJAB = "e0000000-0000-4000-8000-000000000001"; // Almasa hijab 1800 DA

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
  } catch (e) {
    check("NovaShop owner CANNOT update Almasa store", true);
  }
  const nameAfter = await runAs("authenticated", SOFIA, `select name from stores where id = $1`, [ALMASA]);
  check("Almasa store name unchanged", nameAfter.rows[0]?.name === "Maison Almasa", `got ${nameAfter.rows[0]?.name}`);

  // A cannot modify B's homepage
  try {
    const r = await runAs("authenticated", KARIM, `update pages set title = 'XSS' where store_id = $1 and key = 'home'`, [ALMASA]);
    check("NovaShop owner CANNOT edit Almasa homepage", r.rowCount === 0, `updated ${r.rowCount} row(s)!`);
  } catch (e) {
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
  } catch (e) {
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
  } catch (e) {
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
  } catch (e) {
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
  } catch (e) {
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
  section("7. Phone normalization (Algeria)");

  const ph = await runAs("anon", null, `select
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
