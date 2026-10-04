import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { getOwnerConfig } from "../src/lib/auth-config";

test("owner environment configuration rejects partial secrets and non-HTTPS hosted origin", () => {
  const saved = { ...process.env };
  try {
    process.env.SHOP_OWNER_PASSWORD_HASH = `scrypt$${"a".repeat(32)}$${"b".repeat(128)}`;
    delete process.env.SHOP_SESSION_SECRET;
    delete process.env.SHOP_APP_ORIGIN;
    assert.throws(() => getOwnerConfig(), /session secret/);
    process.env.SHOP_SESSION_SECRET = "c".repeat(64);
    process.env.SHOP_APP_ORIGIN = "http://127.0.0.1:4320";
    assert.equal(getOwnerConfig().appOrigin, "http://127.0.0.1:4320");
    process.env.VERCEL = "1";
    assert.throws(() => getOwnerConfig(), /HTTPS/);
    process.env.SHOP_APP_ORIGIN = "https://synthetic-shop.example";
    assert.equal(getOwnerConfig().appOrigin, "https://synthetic-shop.example");
  } finally {
    for (const key of Object.keys(process.env))
      if (!(key in saved)) delete process.env[key];
    Object.assign(process.env, saved);
  }
});

test("local owner helper refuses piped secrets without creating configuration", () => {
  const folder = mkdtempSync(join(tmpdir(), "shop-config-helper-"));
  try {
    const result = spawnSync(
      process.execPath,
      [resolve("scripts/configure-owner.mjs")],
      {
        cwd: folder,
        input: "synthetic-not-a-real-password\n",
        encoding: "utf8",
      }
    );
    assert.equal(result.status, 1);
    assert.match(result.stderr, /interactive private terminal/);
    assert.doesNotMatch(
      result.stdout + result.stderr,
      /synthetic-not-a-real-password/
    );
  } finally {
    rmSync(folder, { recursive: true });
  }
});
