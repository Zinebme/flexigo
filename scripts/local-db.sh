#!/usr/bin/env bash
set -euo pipefail

# FlexiGo — Local DB helpers for integration tests
# Usage:
#   ./scripts/local-db.sh start   — start embedded Postgres (via npm run test:integration)
#   ./scripts/local-db.sh test    — run 62 integration tests
#   ./scripts/local-db.sh migrate — apply migrations to TEST_DATABASE_URL (if set)
#   ./scripts/local-db.sh seed    — print seed info
#
# The integration runner (tests/integration/run.mjs) will automatically:
# - use TEST_DATABASE_URL if set, otherwise spin up embedded-postgres on port 54331
# - apply all migrations in supabase/migrations/
# - run 62 RLS / tenant isolation / checkout / draft-publish / support tests

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

case "${1:-test}" in
  start)
    echo "Starting embedded Postgres is handled by the integration runner."
    echo "Run: npm run test:integration"
    ;;
  test)
    echo "Running integration tests (62 checks)..."
    npm run test:integration
    ;;
  migrate)
    if [ -z "${TEST_DATABASE_URL:-}" ]; then
      echo "TEST_DATABASE_URL not set — using embedded Postgres."
      npm run test:integration -- --migrate-only 2>&1 | head -20 || true
      echo "Migrations live in supabase/migrations/ (0001..0013)"
      ls -1 supabase/migrations/
    else
      echo "Applying migrations to $TEST_DATABASE_URL ..."
      for f in supabase/migrations/*.sql; do
        echo "→ $f"
        psql "$TEST_DATABASE_URL" -f "$f"
      done
    fi
    ;;
  seed)
    echo "Seed is in supabase/migrations/20260918000013_seed_templates.sql"
    echo "It creates:"
    echo "  - 4 templates (ecommerce-modern, fashion-luxury, single-product, portfolio)"
    echo "  - Demo users: a0000000-...-0001 SUPER_ADMIN, ...0011 Sofia Almasa, ...0012 Karim NovaShop, etc."
    echo "  - Password for all demo accounts: Flexigo!2026demo"
    echo "  - 4 stores: Maison Almasa (fashion), NovaShop (general COD), PureSkin (single), Cabinet Horizon (portfolio)"
    echo "  - 36 orders, 27 pages v1"
    ;;
  *)
    echo "Usage: $0 {start|test|migrate|seed}"
    exit 1
    ;;
esac
