import { randomBytes, scryptSync } from "node:crypto";
import { mkdirSync, mkdtempSync, lstatSync } from "node:fs";
import { resolve, join } from "node:path";
import { spawn } from "node:child_process";

// Deliberately public synthetic test credential, never an actual owner's credential.
const fixturePassword = "Synthetic-Shop-QA-Only-2026";
const salt = randomBytes(16);
const digest = scryptSync(fixturePassword, salt, 64, {
  N: 32768,
  r: 8,
  p: 1,
  maxmem: 64 * 1024 * 1024,
});
mkdirSync(resolve(".local"), { recursive: true, mode: 0o700 });
const reuse = process.argv
  .find((value) => value.startsWith("--fixture="))
  ?.slice(10);
if (reuse && !/^qa-fixture-[A-Za-z0-9]{6}$/.test(reuse))
  throw new Error("Only an existing named shop QA fixture may be reused.");
const folder = reuse
  ? resolve(".local", reuse)
  : mkdtempSync(resolve(".local/qa-fixture-"));
if (
  reuse &&
  (!lstatSync(folder).isDirectory() || lstatSync(folder).isSymbolicLink())
)
  throw new Error("Fixture must be a real local directory.");
const env = {
  ...process.env,
  NODE_ENV: "development",
  VERCEL: "",
  DATABASE_URL: "",
  OPENAI_API_KEY: "",
  SHOP_QA_MODE: "true",
  SHOP_AI_ENABLED: "false",
  SHOP_VOICE_ENABLED: "false",
  SHOP_AI_BUDGET_MICRO_USD: "0",
  SHOP_OWNER_PASSWORD_HASH: `scrypt$${salt.toString("hex")}$${digest.toString("hex")}`,
  SHOP_SESSION_SECRET: randomBytes(32).toString("hex"),
  SHOP_APP_ORIGIN: "http://127.0.0.1:4321",
  SHOP_DB_PATH: join(folder, "owner.sqlite"),
  SHOP_PREVIEW_DB_PATH: join(folder, "preview.sqlite"),
  SHOP_AUTH_DB_PATH: join(folder, "auth.sqlite"),
};
process.stdout.write(
  `Isolated synthetic QA server: http://127.0.0.1:4321\nFixture directory: ${folder}\nProvider credentials overridden empty; paid capabilities disabled.\n`
);
const child = spawn(
  process.execPath,
  [
    resolve("node_modules/next/dist/bin/next"),
    "dev",
    "--hostname",
    "127.0.0.1",
    "--port",
    "4321",
  ],
  { stdio: "inherit", env }
);
process.on("SIGINT", () => child.kill("SIGINT"));
process.on("SIGTERM", () => child.kill("SIGTERM"));
child.on("exit", (code) => {
  process.exitCode = code || 0;
});
