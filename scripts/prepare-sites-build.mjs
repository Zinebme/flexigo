import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, ".open-next");
const output = resolve(root, "dist");
const workerBundle = resolve(root, ".sites-worker");
const hostingSource = resolve(root, ".openai", "hosting.json");

rmSync(workerBundle, { recursive: true, force: true });
execFileSync(
  process.execPath,
  [
    resolve(root, "node_modules", "wrangler", "bin", "wrangler.js"),
    "deploy",
    resolve(source, "worker.js"),
    "--dry-run",
    "--outdir",
    workerBundle,
    "--compatibility-date",
    "2026-09-18",
    "--compatibility-flags",
    "nodejs_compat",
    "--compatibility-flags",
    "global_fetch_strictly_public",
    "--assets",
    resolve(source, "assets"),
    "--name",
    "flexigo-sites",
  ],
  { cwd: root, stdio: "inherit" },
);

rmSync(output, { recursive: true, force: true });
mkdirSync(resolve(output, "server"), { recursive: true });
for (const file of readdirSync(workerBundle)) {
  if (file === "README.md" || file.endsWith(".map")) continue;
  const target = file === "worker.js" ? "index.js" : file;
  cpSync(resolve(workerBundle, file), resolve(output, "server", target));
}

// Sites exposes dist/client through the Worker's ASSETS binding.
mkdirSync(resolve(output, "client"), { recursive: true });
cpSync(resolve(source, "assets"), resolve(output, "client"), { recursive: true });

const hostingOutput = resolve(output, ".openai", "hosting.json");
mkdirSync(dirname(hostingOutput), { recursive: true });
writeFileSync(hostingOutput, readFileSync(hostingSource));
