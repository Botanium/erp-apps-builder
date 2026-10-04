import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createSqliteStore } from "../src/lib/store";
import type { Command } from "../src/lib/domain";
import { emptyState, initialState } from "../src/lib/domain";

test("legacy schema-one snapshots read and reopen without inventing historical audit time or losing replay identity", async () => {
  const folder = await mkdtemp(join(tmpdir(), "shop-legacy-store-test-"));
  const filename = join(folder, "test.sqlite");
  const command: Command = {
    type: "supplier.create",
    expectedRevision: 0,
    idempotencyKey: "legacy-supplier-001",
    payload: {
      id: "legacy-supplier",
      name: "Historical synthetic supplier",
      contact: "",
    },
  };
  const snapshot = {
    ...initialState(),
    schemaVersion: 1,
    revision: 1,
    suppliers: [
      {
        id: "legacy-supplier",
        name: "Historical synthetic supplier",
        contact: "",
        synthetic: true,
      },
    ],
    purchases: [
      {
        id: "legacy-purchase",
        supplierId: "legacy-supplier",
        lines: [{ productId: "block", quantity: 2, unitCostMinor: 300 }],
        totalMinor: 600,
        status: "received",
        reference: "SYNTHETIC-OLD-PURCHASE",
        receiptReference: "SYNTHETIC-OLD-RECEIPT",
        synthetic: true,
      },
    ],
    audit: [
      {
        revision: 1,
        action: "supplier.create",
        actor: "test-owner",
        entityId: "legacy-supplier",
        idempotencyKey: "legacy-supplier-001",
        provenance: "human-recorded-preview",
        summary: "Historical synthetic supplier",
      },
    ],
    processedCommands: {
      "legacy-supplier-001":
        '{"actor":"test-owner","command":{"expectedRevision":0,"idempotencyKey":"legacy-supplier-001","payload":{"contact":"","id":"legacy-supplier","name":"Historical synthetic supplier"},"type":"supplier.create"}}',
    },
  };
  let store = await createSqliteStore(filename, () =>
    JSON.parse(JSON.stringify(snapshot))
  );
  try {
    const loaded = await store.read();
    assert.equal(loaded.schemaVersion, 2);
    assert.deepEqual(loaded.audit, snapshot.audit);
    assert.deepEqual(loaded.processedCommands, snapshot.processedCommands);
    assert.equal(loaded.purchases[0].totalMinor, 600);
    assert.equal(loaded.purchases[0].lines[0].receivedQuantity, 2);
    assert.equal(loaded.purchases[0].lines[0].remainingQuantity, 0);
    assert.deepEqual(loaded.purchases[0].receipts, []);
    assert.equal(loaded.purchases[0].receiptReference, "SYNTHETIC-OLD-RECEIPT");
    assert.equal(loaded.products[0].stock, 3);
    const replay = await store.execute(command, "test-owner");
    assert.equal(replay.revision, 1);
    assert.deepEqual(replay.audit, snapshot.audit);
    assert.deepEqual(await store.readConversation(), []);
    await store.close();
    store = await createSqliteStore(filename);
    assert.deepEqual(await store.read(), replay);
  } finally {
    await store.close();
    await rm(folder, { recursive: true });
  }
});

test("unsupported persisted schema fails closed at read and command interfaces", async () => {
  const store = await createSqliteStore(":memory:", () =>
    JSON.parse(JSON.stringify({ ...initialState(), schemaVersion: 999 }))
  );
  try {
    await assert.rejects(store.read(), /schema|version/i);
    await assert.rejects(
      store.execute(
        {
          type: "supplier.create",
          expectedRevision: 0,
          idempotencyKey: "unknown-schema-test",
          payload: { id: "unsafe", name: "Must not save", contact: "" },
        },
        "test-owner"
      ),
      /schema|version/i
    );
    assert.deepEqual(await store.readConversation(), []);
  } finally {
    await store.close();
  }
});

test("shop transaction persists through close and reopen without reseeding", async () => {
  const folder = await mkdtemp(join(tmpdir(), "shop-store-test-"));
  const filename = join(folder, "test.sqlite");
  let store = await createSqliteStore(filename);
  try {
    const before = await store.read();
    const command: Command = {
      idempotencyKey: "persist-product-1",
      expectedRevision: before.revision,
      type: "product.create",
      payload: {
        id: "test-eraser",
        sku: "TEST-ERASER",
        name: "Synthetic eraser",
        category: "Stationery",
        priceMinor: 250,
        lowStockAt: 2,
      },
    };
    await store.execute(command, "test-owner");
    await store.close();
    store = await createSqliteStore(filename);
    const after = await store.read();
    assert.equal(after.revision, 1);
    assert.equal(after.products.find((p) => p.id === "test-eraser")?.stock, 0);
    assert.equal(after.audit[0].actor, "test-owner");
    const history = await store.readConversation();
    assert.equal(history.length, 1);
    assert.equal(history[0].mode, "system");
    assert.match(history[0].text, /product.create/);
    await store.execute(command, "test-owner");
    assert.equal((await store.readConversation()).length, 1);
  } finally {
    await store.close();
    await rm(folder, { recursive: true });
  }
});

test("AI spend reservations survive restart, reject duplicate attempts, and fail at cap", async () => {
  const folder = await mkdtemp(join(tmpdir(), "shop-budget-test-"));
  const filename = join(folder, "test.sqlite");
  let store = await createSqliteStore(filename);
  try {
    await assert.rejects(
      store.reserveBudget("request-zero", 100, 0),
      /not configured/
    );
    await store.reserveBudget("request-first", 600, 1000);
    await assert.rejects(
      store.reserveBudget("request-first", 100, 1000),
      /already reserved/
    );
    await store.close();
    store = await createSqliteStore(filename);
    await assert.rejects(
      store.reserveBudget("request-second", 401, 1000),
      /exhausted/
    );
    await store.reserveBudget("request-third", 400, 1000);
    await assert.rejects(
      store.reserveBudget("request-fourth", 1, 1000),
      /exhausted/
    );
  } finally {
    await store.close();
    await rm(folder, { recursive: true });
  }
});

test("two writers cannot commit different commands against the same shop revision", async () => {
  const folder = await mkdtemp(join(tmpdir(), "shop-race-test-"));
  const filename = join(folder, "test.sqlite");
  const left = await createSqliteStore(filename);
  const right = await createSqliteStore(filename);
  try {
    const command: Command = {
      idempotencyKey: "race-product-left",
      expectedRevision: 0,
      type: "product.create",
      payload: {
        id: "race-left",
        sku: "RACE-LEFT",
        name: "Synthetic left",
        category: "Art",
        priceMinor: 250,
        lowStockAt: 2,
      },
    };
    const competing: Command = {
      ...command,
      idempotencyKey: "race-product-right",
      payload: { ...command.payload, id: "race-right", sku: "RACE-RIGHT" },
    };
    const result = await Promise.allSettled([
      left.execute(command, "test-owner"),
      right.execute(competing, "test-owner"),
    ]);
    assert.equal(result.filter((x) => x.status === "fulfilled").length, 1);
    assert.equal((await right.read()).revision, 1);
    assert.equal((await right.read()).products.length, 4);
  } finally {
    await left.close();
    await right.close();
    await rm(folder, { recursive: true });
  }
});

test("empty owner shop and synthetic preview are independent persisted workspaces", async () => {
  const folder = await mkdtemp(join(tmpdir(), "shop-isolation-test-"));
  const preview = await createSqliteStore(join(folder, "preview.sqlite"));
  const shop = await createSqliteStore(join(folder, "shop.sqlite"), emptyState);
  try {
    assert.equal((await preview.read()).products.length, 3);
    assert.equal((await shop.read()).mode, "shop");
    assert.equal((await shop.read()).products.length, 0);
    assert.equal((await shop.read()).orders.length, 0);
    assert.equal((await preview.read()).revision, 0);
  } finally {
    await preview.close();
    await shop.close();
    await rm(folder, { recursive: true });
  }
});

test("confirmed inventory count is timestamped by the store and reopens the inventory card exactly once", async () => {
  const store = await createSqliteStore(":memory:");
  const command: Command = {
    type: "stock.adjust",
    idempotencyKey: "store-stock-count-001",
    expectedRevision: 0,
    payload: {
      productId: "block",
      countedStock: 5,
      reference: "Synthetic physical count",
    },
  };
  try {
    const before = Date.now();
    const state = await store.execute(command, "test-owner");
    const after = Date.now();
    const recorded = state.audit[0].recordedAt;
    assert.ok(recorded);
    assert.ok(Date.parse(recorded) >= before && Date.parse(recorded) <= after);
    assert.deepEqual(state.audit[0].stockChange, {
      before: 3,
      after: 5,
      delta: 2,
      reference: "Synthetic physical count",
    });
    const history = await store.readConversation();
    assert.equal(history.length, 1);
    assert.equal(history[0].cards?.[0].type, "products");
    assert.match(history[0].text, /stock.adjust/);
    assert.equal(
      (await store.execute(command, "test-owner")).audit[0].recordedAt,
      recorded
    );
    assert.deepEqual(await store.readConversation(), history);
  } finally {
    await store.close();
  }
});

test("catalog updates and partial receipts persist attributed contextual confirmations without changing old order prices", async () => {
  const store = await createSqliteStore(":memory:");
  try {
    let state = await store.execute(
      {
        type: "product.update",
        idempotencyKey: "store-update-product",
        expectedRevision: 0,
        payload: {
          productId: "block",
          name: "Updated synthetic blocks",
          sku: "UPDATED-BLOCK",
          priceMinor: 1500,
        },
      },
      "test-owner"
    );
    assert.equal(state.orders[0].totalMinor, 2000);
    assert.equal(
      (await store.readConversation()).at(-1)?.cards?.[0].type,
      "products"
    );
    state = await store.execute(
      {
        type: "purchase.create",
        idempotencyKey: "store-partial-purchase",
        expectedRevision: state.revision,
        payload: {
          id: "store-purchase",
          supplierId: "supplier-demo",
          lines: [{ productId: "block", quantity: 3, unitCostMinor: 500 }],
          reference: "SYNTHETIC-PO",
        },
      },
      "test-owner"
    );
    const partial: Command = {
      type: "purchase.receive-lines",
      idempotencyKey: "store-partial-receipt",
      expectedRevision: state.revision,
      payload: {
        purchaseId: "store-purchase",
        lines: [{ productId: "block", quantity: 1 }],
        reference: "SYNTHETIC-RECEIPT-ONE",
      },
    };
    state = await store.execute(partial, "test-owner");
    assert.equal(state.purchases[0].status, "partially-received");
    assert.equal(state.products[0].stock, 4);
    assert.equal(state.purchases[0].lines[0].remainingQuantity, 2);
    assert.equal(
      state.purchases[0].receipts?.[0].recordedAt,
      state.audit.at(-1)?.recordedAt
    );
    const history = await store.readConversation();
    assert.deepEqual(history.at(-1)?.cards, [
      { type: "purchase", entityId: "store-purchase" },
    ]);
    await store.execute(partial, "test-owner");
    assert.deepEqual(await store.readConversation(), history);
    await assert.rejects(
      store.execute(
        {
          type: "purchase.receive",
          idempotencyKey: "store-invalid-full-receipt",
          expectedRevision: state.revision,
          payload: {
            purchaseId: "store-purchase",
            reference: "Must not reinterpret old full receipt",
          },
        },
        "test-owner"
      )
    );
    assert.equal((await store.read()).products[0].stock, 4);
  } finally {
    await store.close();
  }
});

test("failed COD delivery and physical saleable return persist separate timestamped order confirmations", async () => {
  const store = await createSqliteStore(":memory:");
  try {
    await store.execute(
      {
        type: "order.reserve",
        idempotencyKey: "return-reserve-001",
        expectedRevision: 0,
        payload: { orderId: "wa-demo" },
      },
      "test-owner"
    );
    await store.execute(
      {
        type: "order.pack",
        idempotencyKey: "return-pack-001",
        expectedRevision: 1,
        payload: { orderId: "wa-demo" },
      },
      "test-owner"
    );
    await store.execute(
      {
        type: "order.dispatch",
        idempotencyKey: "return-dispatch-001",
        expectedRevision: 2,
        payload: { orderId: "wa-demo", reference: "SYNTHETIC-DISPATCH" },
      },
      "test-owner"
    );
    const failed: Command = {
      type: "order.delivery-failed",
      idempotencyKey: "return-failure-001",
      expectedRevision: 3,
      payload: { orderId: "wa-demo", reference: "SYNTHETIC-FAILED-ATTEMPT" },
    };
    const failedState = await store.execute(failed, "test-owner");
    assert.equal(
      failedState.products.find((product) => product.id === "marker")?.stock,
      1
    );
    assert.equal(
      failedState.orders.find((order) => order.id === "wa-demo")?.status,
      "delivery-failed"
    );
    assert.deepEqual((await store.readConversation()).at(-1)?.cards, [
      { type: "order", entityId: "wa-demo" },
    ]);
    assert.ok(
      failedState.orders
        .find((order) => order.id === "wa-demo")
        ?.evidence.at(-1)?.recordedAt
    );
    const returned: Command = {
      type: "order.return-received",
      idempotencyKey: "return-physical-001",
      expectedRevision: 4,
      payload: {
        orderId: "wa-demo",
        condition: "all-saleable",
        reference: "SYNTHETIC-PHYSICAL-RECEIPT",
      },
    };
    const restored = await store.execute(returned, "test-owner");
    assert.equal(
      restored.products.find((product) => product.id === "marker")?.stock,
      2
    );
    assert.equal(
      restored.orders.find((order) => order.id === "wa-demo")?.paymentStatus,
      "not-due"
    );
    assert.equal(
      restored.orders.find((order) => order.id === "wa-demo")?.evidence.at(-1)
        ?.recordedAt,
      restored.audit.at(-1)?.recordedAt
    );
    const history = await store.readConversation();
    assert.equal(history.length, 5);
    assert.deepEqual(history.at(-1)?.cards, [
      { type: "order", entityId: "wa-demo" },
    ]);
    assert.deepEqual(await store.execute(returned, "test-owner"), restored);
    assert.deepEqual(await store.readConversation(), history);
  } finally {
    await store.close();
  }
});
