import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createSqliteAuthStore, type AuthSession } from "../src/lib/auth-store";
import {
  createSession,
  errorResponse,
  requireSameOrigin,
} from "../src/lib/auth";

test("auth sessions and global owner throttle survive store restart; raw tokens are not stored", async () => {
  const filename = join(
    mkdtempSync(join(tmpdir(), "shop-auth-test-")),
    "auth.sqlite"
  );
  const session: AuthSession = {
    actor: "owner",
    mode: "owner",
    workspace: "shop",
    origin: "https://shop.example",
    expiresAt: Date.now() + 60000,
    credentialVersion: "test-fingerprint",
  };
  let store = await createSqliteAuthStore(filename);
  await store.put("hashed-token-only", session);
  for (let i = 0; i < 5; i++)
    assert.equal(await store.attempt(Date.now()), true);
  assert.equal(await store.attempt(Date.now()), false);
  await store.close();
  store = await createSqliteAuthStore(filename);
  assert.deepEqual(await store.get("hashed-token-only"), session);
  assert.equal(
    await store.attempt(Date.now()),
    false,
    "restart must not reset rate limit"
  );
  assert.equal(await store.attempt(Date.now() + 16 * 60000), true);
  await store.resetAttempts();
  assert.equal(await store.attempt(Date.now()), true);
  await store.remove("hashed-token-only");
  assert.equal(await store.get("hashed-token-only"), undefined);
  await store.put("expired", { ...session, expiresAt: Date.now() - 1 });
  assert.equal(await store.get("expired"), undefined);
  await store.close();
});

test("synthetic hosted configuration permits trusted origin validation, rejects preview and missing prerequisites", async () => {
  const env = process.env as Record<string, string | undefined>;
  const vars = [
    "NODE_ENV",
    "SHOP_APP_ORIGIN",
    "SHOP_OWNER_PASSWORD_HASH",
    "SHOP_SESSION_SECRET",
    "DATABASE_URL",
  ];
  const previous = Object.fromEntries(vars.map((key) => [key, env[key]]));
  Object.assign(env, {
    NODE_ENV: "production",
    SHOP_APP_ORIGIN: "https://shop.example",
    SHOP_OWNER_PASSWORD_HASH: `scrypt$${"a".repeat(32)}$${"b".repeat(128)}`,
    SHOP_SESSION_SECRET: "c".repeat(64),
    DATABASE_URL: "postgresql://fixture.invalid/not-accessed",
  });
  const request = new Request("https://shop.example/api/session", {
    headers: { Origin: "https://shop.example", Host: "shop.example" },
  });
  try {
    assert.doesNotThrow(() => requireSameOrigin(request));
    await assert.rejects(
      () => createSession(request, { mode: "preview" }),
      /local development loopback/
    );
    assert.throws(
      () =>
        requireSameOrigin(
          new Request("https://shop.example/api/session", {
            headers: { Origin: "https://attacker.example" },
          })
        ),
      /Same-origin/
    );
    delete env.DATABASE_URL;
    try {
      requireSameOrigin(request);
      assert.fail("Missing database must fail");
    } catch (error) {
      assert.equal(errorResponse(error).status, 503);
    }
    delete env.SHOP_OWNER_PASSWORD_HASH;
    try {
      requireSameOrigin(request);
      assert.fail("Missing owner must fail");
    } catch (error) {
      assert.equal(errorResponse(error).status, 503);
    }
  } finally {
    for (const key of vars) {
      if (previous[key] === undefined) delete env[key];
      else env[key] = previous[key];
    }
  }
});

test("Next dev loopback URL alias normalization preserves exact port, Origin and Host checks", () => {
  assert.doesNotThrow(() =>
    requireSameOrigin(
      new Request("http://localhost:4321/api/session", {
        headers: {
          Host: "127.0.0.1:4321",
          Origin: "http://127.0.0.1:4321",
          "x-forwarded-host": "127.0.0.1:4321",
        },
      })
    )
  );
  assert.throws(
    () =>
      requireSameOrigin(
        new Request("http://localhost:4321/api/session", {
          headers: { Host: "127.0.0.1:4322", Origin: "http://127.0.0.1:4322" },
        })
      ),
    /Host mismatch/
  );
  assert.throws(
    () =>
      requireSameOrigin(
        new Request("http://localhost:4321/api/session", {
          headers: {
            Host: "attacker.example:4321",
            Origin: "http://attacker.example:4321",
          },
        })
      ),
    /Host mismatch/
  );
  assert.throws(
    () =>
      requireSameOrigin(
        new Request("http://localhost:4321/api/session", {
          headers: { Host: "127.0.0.1:4321", Origin: "http://localhost:4321" },
        })
      ),
    /Same-origin/
  );
});
