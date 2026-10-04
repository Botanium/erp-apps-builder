import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { Pool } from "pg";
import { createPostgresStore, type ShopStore } from "../src/lib/store";
import { createPostgresAuthStore, type AuthStore } from "../src/lib/auth-store";
import type { Command } from "../src/lib/domain";
import type { ConversationMessage } from "../src/lib/conversation";

/** Uses one NEW cached-image container, loopback-only ephemeral port and tmpfs. Never touches existing containers. */
async function main() {
  const name = `shop-app-pg-qa-${randomBytes(6).toString("hex")}`;
  const adminPassword = randomBytes(32).toString("hex");
  const appPassword = randomBytes(32).toString("hex");
  let created = false;
  let admin: Pool | undefined;
  const stores: ShopStore[] = [];
  const authStores: AuthStore[] = [];
  const docker = (args: string[], env = process.env) =>
    execFileSync("docker", args, {
      encoding: "utf8",
      env,
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  const passed: string[] = [];
  try {
    docker(["image", "inspect", "postgres:17-alpine", "--format", "{{.Id}}"]);
    docker(
      [
        "run",
        "--detach",
        "--rm",
        "--pull=never",
        "--name",
        name,
        "--label",
        "shop-app.synthetic-qa=true",
        "--memory",
        "256m",
        "--cpus",
        "1",
        "--publish",
        "127.0.0.1::5432",
        "--tmpfs",
        "/var/lib/postgresql/data:rw,size=128m",
        "--env",
        "POSTGRES_DB=shop_synthetic_qa",
        "--env",
        "POSTGRES_USER=shop_fixture_admin",
        "--env",
        "POSTGRES_PASSWORD",
        "postgres:17-alpine",
      ],
      { ...process.env, POSTGRES_PASSWORD: adminPassword }
    );
    created = true;
    const binding = docker(["port", name, "5432/tcp"]);
    assert.match(binding, /^127\.0\.0\.1:\d+$/);
    const port = Number(binding.split(":")[1]);
    admin = new Pool({
      host: "127.0.0.1",
      port,
      database: "shop_synthetic_qa",
      user: "shop_fixture_admin",
      password: adminPassword,
      connectionTimeoutMillis: 1000,
    });
    let ready = false;
    for (let i = 0; i < 40; i++) {
      try {
        await admin.query("SELECT 1");
        ready = true;
        break;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    }
    assert.equal(ready, true, "isolated PostgreSQL became ready");
    for (const migration of [
      "001_shop_state.sql",
      "002_auth.sql",
      "003_conversation.sql",
    ])
      await admin.query(readFileSync(`migrations/${migration}`, "utf8"));
    await admin.query(
      `CREATE ROLE shop_app_test LOGIN PASSWORD '${appPassword}' NOSUPERUSER NOCREATEDB NOCREATEROLE`
    );
    await admin.query(
      "GRANT CONNECT ON DATABASE shop_synthetic_qa TO shop_app_test; GRANT USAGE ON SCHEMA public TO shop_app_test; GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA public TO shop_app_test; GRANT USAGE,SELECT ON ALL SEQUENCES IN SCHEMA public TO shop_app_test"
    );
    const url = `postgresql://shop_app_test:${appPassword}@127.0.0.1:${port}/shop_synthetic_qa`;
    const shop = await createPostgresStore(url);
    stores.push(shop);
    const concurrent = await createPostgresStore(url);
    stores.push(concurrent);
    assert.equal((await shop.read()).mode, "shop");
    assert.equal((await shop.read()).products.length, 0);
    const setup: Command = {
      type: "setup.configure",
      idempotencyKey: "postgres-setup-001",
      expectedRevision: 0,
      payload: {
        businessName: "Synthetic PostgreSQL QA",
        currency: "USD",
        currencyDecimals: 2,
      },
    };
    await shop.execute(setup, "synthetic-owner");
    assert.equal((await shop.readConversation()).length, 1);
    await concurrent.execute(setup, "synthetic-owner");
    assert.equal((await shop.read()).revision, 1);
    assert.equal((await shop.readConversation()).length, 1);
    passed.push(
      "restricted-role migrations, empty initialization and atomic replay-safe command confirmation"
    );

    const make = (id: string): Command => ({
      type: "product.create",
      idempotencyKey: `postgres-product-${id}`,
      expectedRevision: 1,
      payload: {
        id,
        sku: id.toUpperCase(),
        name: `Synthetic ${id}`,
        category: "Art",
        priceMinor: 250,
        lowStockAt: 1,
      },
    });
    const writes = await Promise.allSettled([
      shop.execute(make("first"), "synthetic-owner"),
      concurrent.execute(make("second"), "synthetic-owner"),
    ]);
    assert.equal(
      writes.filter((result) => result.status === "fulfilled").length,
      1
    );
    assert.equal((await shop.read()).revision, 2);
    assert.equal((await shop.read()).products.length, 1);
    assert.equal((await shop.readConversation()).length, 2);
    passed.push(
      "row-locked concurrent writes reject stale revision without partial business/audit/transcript commit"
    );

    // Seed an old-format fixture only in this freshly created disposable database.
    // Assertions still cross the public store interface, never query storage internals.
    const historical = await shop.read();
    await admin.query("UPDATE shop_state SET document=$1::jsonb WHERE id=$2", [
      JSON.stringify({ ...historical, schemaVersion: 1 }),
      "primary",
    ]);
    assert.equal((await concurrent.read()).schemaVersion, 2);
    assert.deepEqual((await concurrent.read()).audit, historical.audit);
    assert.deepEqual(
      (await concurrent.execute(setup, "synthetic-owner")).processedCommands,
      historical.processedCommands
    );
    assert.equal((await shop.readConversation()).length, 2);
    assert.ok(
      historical.audit.every(
        (event) =>
          event.recordedAt && Number.isFinite(Date.parse(event.recordedAt))
      )
    );
    passed.push(
      "legacy schema read compatibility and exact command replay preserve audit, fingerprints and confirmations"
    );

    const reservation = await Promise.allSettled([
      shop.reserveBudget("postgres-budget-first", 600, 1000),
      concurrent.reserveBudget("postgres-budget-second", 600, 1000),
    ]);
    assert.equal(
      reservation.filter((result) => result.status === "fulfilled").length,
      1
    );
    await assert.rejects(
      shop.reserveBudget("postgres-budget-third", 401, 1000),
      /exhausted/
    );
    passed.push("transactional shared spend cap rejects concurrent overrun");

    const starts = await Promise.all([
      shop.beginConversation(
        "postgres-chat-001",
        "Show products",
        "local-guide"
      ),
      concurrent.beginConversation(
        "postgres-chat-001",
        "Show products",
        "local-guide"
      ),
    ]);
    assert.deepEqual(starts.sort(), ["created", "pending"]);
    const response: ConversationMessage = {
      id: "postgres-chat-001:assistant",
      requestId: "postgres-chat-001",
      role: "assistant",
      mode: "local-guide",
      text: "Synthetic guide response; no business changes.",
      cards: [{ type: "products" }],
      createdAt: new Date().toISOString(),
    };
    await shop.finishConversation("postgres-chat-001", response);
    assert.equal((await concurrent.readConversation()).length, 4);
    assert.equal(
      await concurrent.beginConversation(
        "postgres-chat-001",
        "Show products",
        "local-guide"
      ),
      "completed"
    );
    await assert.rejects(
      concurrent.beginConversation(
        "postgres-chat-001",
        "Changed request",
        "local-guide"
      ),
      /different input/
    );
    await concurrent.clearConversation();
    assert.equal((await shop.readConversation()).length, 0);
    assert.equal(
      await shop.beginConversation(
        "postgres-chat-001",
        "Show products",
        "local-guide"
      ),
      "completed"
    );
    passed.push(
      "durable conversation concurrency, replay fingerprint, completed response and clear tombstones"
    );

    const auth = await createPostgresAuthStore(url);
    authStores.push(auth);
    const otherAuth = await createPostgresAuthStore(url);
    authStores.push(otherAuth);
    const tokenHash = randomBytes(32).toString("hex");
    await auth.put(tokenHash, {
      actor: "synthetic-owner",
      mode: "owner",
      workspace: "shop",
      expiresAt: Date.now() + 60_000,
      origin: "https://synthetic.example",
      credentialVersion: "synthetic-v1",
    });
    assert.equal((await otherAuth.get(tokenHash))?.workspace, "shop");
    await otherAuth.remove(tokenHash);
    assert.equal(await auth.get(tokenHash), undefined);
    const attempts = await Promise.all(
      Array.from({ length: 7 }, (_, i) =>
        (i % 2 ? auth : otherAuth).attempt(Date.now())
      )
    );
    assert.equal(attempts.filter(Boolean).length, 5);
    passed.push(
      "durable auth session revocation and global concurrent login throttle"
    );
    console.log(
      JSON.stringify(
        {
          database: "isolated synthetic PostgreSQL 17",
          role: "non-superuser shop_app_test",
          checksPassed: passed,
          providerCalls: 0,
          existingContainersModified: 0,
        },
        null,
        2
      )
    );
  } catch (error) {
    console.error(
      "Isolated PostgreSQL verification failed:",
      error instanceof Error ? error.message : "unknown error"
    );
    process.exitCode = 1;
  } finally {
    for (const auth of authStores) await auth.close().catch(() => undefined);
    for (const store of stores) await store.close().catch(() => undefined);
    await admin?.end().catch(() => undefined);
    if (created) {
      docker(["stop", "--timeout", "5", name]);
      console.log(
        "Removed only the newly created disposable QA container and its tmpfs synthetic database. No existing container was changed."
      );
    }
  }
}
void main();
