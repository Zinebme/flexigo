import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Vitest configuration (additive — Next.js ignores it).
 *
 * The `@/` alias mirrors tsconfig paths so component tests can import the real
 * modules, and unit tests live under tests/unit (integration tests keep running
 * through `npm run test:integration`).
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.{ts,tsx}"],
  },
});
