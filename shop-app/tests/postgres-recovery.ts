/** Child-process fixture: real disposable PostgreSQL only, never an existing app database. */
import assert from "node:assert/strict";
import { Pool } from "pg";
import { readState, executeCommand, readConversation } from "../src/lib/store";
import type { Command } from "../src/lib/domain";

let phase = "prepare isolated permission failure";
async function verifyRecovery() {
  assert.match(
    process.env.SHOP_RECOVERY_FIXTURE || "",
    /^shop-app-pg-qa-[0-9a-f]{12}$/
  );
  const adminUrl = new URL(process.env.SHOP_RECOVERY_ADMIN_URL || "");
  const appUrl = new URL(process.env.DATABASE_URL || "");
  for (const url of [adminUrl, appUrl]) {
    assert.equal(url.protocol, "postgresql:");
    assert.equal(url.hostname, "127.0.0.1");
    assert.equal(url.pathname, "/shop_synthetic_qa");
    assert.match(url.port, /^\d+$/);
  }
  assert.equal(adminUrl.port, appUrl.port);
  assert.equal(adminUrl.username, "shop_fixture_admin");
  assert.equal(appUrl.username, "shop_app_test");
  const admin = new Pool({ connectionString: adminUrl.toString() });
  try {
    // Make initialization fail deterministically without disrupting other containers.
    await admin.query("REVOKE INSERT ON shop_state FROM shop_app_test");
    const failures = await Promise.allSettled([
      readState("shop"),
      readState("shop"),
    ]);
    assert.equal(
      failures.filter((result) => result.status === "rejected").length,
      2
    );
    await admin.query("GRANT INSERT ON shop_state TO shop_app_test");

    // The same process must recover; no module reload, cache reset or process restart.
    phase = "read state after permission recovery in the same process";
    const [before, concurrent] = await Promise.all([
      readState("shop"),
      readState("shop"),
    ]);
    assert.deepEqual(concurrent, before);
    const priorHistory = await readConversation("shop");
    phase = "concurrent command replay after recovery";
    const command: Command = {
      type: "product.create",
      idempotencyKey: "postgres-recovery-product-001",
      expectedRevision: before.revision,
      payload: {
        id: "recovery-product",
        sku: "RECOVERY-PRODUCT",
        name: "Synthetic recovery product",
        category: "Art",
        priceMinor: 250,
        lowStockAt: 1,
      },
    };
    const [first, replay] = await Promise.all([
      executeCommand(command, "synthetic-owner", "shop"),
      executeCommand(command, "synthetic-owner", "shop"),
    ]);
    assert.deepEqual(replay, first);
    assert.equal(first.revision, before.revision + 1);
    assert.equal(
      first.products.filter((product) => product.id === "recovery-product")
        .length,
      1
    );
    assert.equal(first.audit.length, before.audit.length + 1);
    assert.equal(
      (await readConversation("shop")).length,
      priorHistory.length + 1
    );
    await assert.rejects(
      executeCommand(
        {
          ...command,
          payload: { ...command.payload, name: "Different content" },
        },
        "synthetic-owner",
        "shop"
      ),
      /different|reuse|conflict/i
    );
    assert.deepEqual(await readState("shop"), first);
    console.log(
      "PASS: failed PostgreSQL initialization recovers in-process; concurrent replay commits one business/audit/confirmation effect."
    );
  } finally {
    await admin.end();
  }
}

// End this dedicated test process to close its runtime-owned cached pool without a test-only cache API.
verifyRecovery().then(
  () => process.exit(0),
  () => {
    console.error(`FAIL: isolated PostgreSQL recovery at ${phase}.`);
    process.exit(1);
  }
);
