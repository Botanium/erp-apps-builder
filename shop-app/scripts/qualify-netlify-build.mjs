import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
process.chdir(root);
assert.ok(
  /[/]\.qualification[/]/.test(root) ||
    process.env.SHOP_LOCAL_QUALIFICATION === "true",
  "Use an isolated public-only checkout and explicitly set SHOP_LOCAL_QUALIFICATION=true"
);
assert.equal(process.versions.node, "24.16.0");
const guard = resolve("scripts/qualification-network-guard.mjs");
if (process.argv[2] !== "--isolated-child") {
  const child = spawnSync(
    process.execPath,
    ["--import", guard, fileURLToPath(import.meta.url), "--isolated-child"],
    {
      stdio: "inherit",
      env: {
        PATH: process.env.PATH,
        TMPDIR: tmpdir(),
        SHOP_LOCAL_QUALIFICATION: "true",
        NODE_ENV: "production",
        NEXT_TELEMETRY_DISABLED: "1",
        OTEL_SDK_DISABLED: "true",
        SHOP_AI_ENABLED: "false",
        SHOP_VOICE_ENABLED: "false",
        SHOP_AI_BUDGET_MICRO_USD: "0",
        NODE_OPTIONS: `--import=${pathToFileURL(guard).href}`,
      },
    }
  );
  process.exit(child.status ?? 1);
}
for (const file of [
  ".env",
  ".env.local",
  ".env.production",
  ".env.production.local",
  ".local",
])
  assert.equal(existsSync(file), false, `Private input forbidden: ${file}`);
const { onPreBuild, onBuild } = await import("@netlify/plugin-nextjs");
const fail = (message) => {
  throw new Error(String(message));
};
const netlifyConfig = { headers: [], redirects: [] };
const options = {
  constants: {
    IS_LOCAL: true,
    PUBLISH_DIR: resolve(".next"),
    PACKAGE_PATH: "",
    NETLIFY_BUILD_VERSION: "35.15.0",
  },
  netlifyConfig,
  utils: {
    build: { failBuild: fail, failPlugin: fail, cancelBuild: fail },
    cache: { save: async () => false, restore: async () => false },
  },
};
await onPreBuild(options);
const build = spawnSync(
  process.execPath,
  ["node_modules/next/dist/bin/next", "build"],
  { stdio: "inherit", env: process.env }
);
assert.equal(build.status, 0, "Clean Next build succeeds");
await onBuild(options);
const server =
  ".netlify/functions-internal/___netlify-server-handler/___netlify-server-handler.mjs";
assert.ok(existsSync(server), "Real adapter handler generated");
const manifest = JSON.parse(
  readFileSync(".next/required-server-files.json", "utf8")
);
let files = 0;
function scan(path) {
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    assert.ok(
      !/^\.env(?:\.|$)|^owner-config\.json$|\.(?:db|sqlite|sqlite3)(?:-(?:wal|shm))?$/.test(
        entry.name
      ),
      "Generated artifact contains no private config/database path"
    );
    assert.notEqual(entry.name, ".local");
    if (entry.isDirectory()) scan(resolve(path, entry.name));
    else files++;
  }
}
scan(resolve(".netlify"));
writeFileSync(
  ".netlify/qualification-build.json",
  JSON.stringify(
    {
      next: "16.3.8",
      adapter: "5.16.1",
      node: process.versions.node,
      localOnly: true,
      relativeAppDir: manifest.relativeAppDir,
      artifactFiles: files,
      netlifyConfig,
    },
    null,
    2
  )
);
console.log(
  JSON.stringify({
    adapterGenerated: true,
    artifactFiles: files,
    relativeAppDir: manifest.relativeAppDir,
    cloudCalls: 0,
    providerCalls: 0,
  })
);
const verify = spawnSync(
  process.execPath,
  ["scripts/verify-netlify-artifact.mjs"],
  { stdio: "inherit", env: process.env }
);
assert.equal(
  verify.status,
  0,
  "Full adapter content and client boundary scan passes"
);
