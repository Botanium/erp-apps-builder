import test from "node:test";
import assert from "node:assert/strict";
import {
  initialState,
  emptyState,
  normalizeState,
  applyCommand,
  type Command,
  type ShopState,
} from "../src/lib/domain.ts";

test("preview starts with isolated fictitious stock and unreserved channel drafts", () => {
  const state = initialState();
  assert.deepEqual(
    state.products.map((p) => [p.id, p.stock, p.reserved]),
    [
      ["block", 3, 0],
      ["marker", 2, 0],
      ["notebook", 4, 0],
    ]
  );
  assert.equal(state.currency, "DEMO");
  assert.equal(state.orders.length, 3);
  assert.ok(state.orders.every((o) => o.status === "draft" && o.synthetic));
});

const run = (
  state: ShopState,
  type: Command["type"],
  payload: unknown,
  key = `test-${state.revision + 1}`
) =>
  applyCommand(
    state,
    {
      type,
      payload,
      expectedRevision: state.revision,
      idempotencyKey: key,
    } as Command,
    "owner-test"
  );

test("owner creates a zero-stock product without altering the prior snapshot", () => {
  const before = initialState();
  const after = run(before, "product.create", {
    id: "paint",
    sku: "PAINT-1",
    name: "Synthetic paint",
    category: "Art",
    priceMinor: 2500,
    lowStockAt: 3,
  });
  assert.equal(before.products.length, 3);
  assert.deepEqual(after.products[3], {
    id: "paint",
    sku: "PAINT-1",
    name: "Synthetic paint",
    category: "Art",
    priceMinor: 2500,
    lowStockAt: 3,
    stock: 0,
    reserved: 0,
    synthetic: true,
  });
  assert.equal(after.audit[0].actor, "owner-test");
  assert.equal(after.revision, 1);
});

test("commands reject forged fields, unknown actions, invalid prices, duplicate IDs, stale revisions, and unattributed actors", () => {
  const state = initialState();
  const payload = {
    id: "paint",
    sku: "PAINT-1",
    name: "Synthetic paint",
    category: "Art",
    priceMinor: 2500,
    lowStockAt: 3,
  };
  const cmd = {
    idempotencyKey: "c1",
    expectedRevision: 0,
    type: "product.create",
    payload,
  } as Command;
  for (const bad of [
    { ...cmd, type: "sql.execute" },
    { ...cmd, actor: "ai" },
    { ...cmd, payload: { ...payload, stock: 900 } },
    { ...cmd, payload: { ...payload, priceMinor: 1.5 } },
    { ...cmd, payload: { ...payload, id: "block" } },
    { ...cmd, expectedRevision: 9 },
  ]) {
    assert.throws(() => applyCommand(state, bad as Command, "owner-test"));
  }
  assert.throws(() => applyCommand(state, cmd, ""));
  assert.equal(state.revision, 0);
});

test("retrying a successful command has no effect while key reuse for different content conflicts", () => {
  const cmd: Command = {
    idempotencyKey: "same-key",
    expectedRevision: 0,
    type: "product.create",
    payload: {
      id: "paint",
      sku: "PAINT",
      name: "Paint",
      category: "Art",
      priceMinor: 100,
      lowStockAt: 0,
    },
  };
  const after = applyCommand(initialState(), cmd, "owner-test");
  assert.deepEqual(applyCommand(after, cmd, "owner-test"), after);
  assert.throws(
    () =>
      applyCommand(
        after,
        { ...cmd, payload: { ...cmd.payload, priceMinor: 200 } },
        "owner-test"
      ),
    /key/i
  );
  assert.throws(() => applyCommand(after, cmd, "different-owner"), /key/i);
});

test("manual channel intake captures a price snapshot without reserving stock", () => {
  const state = run(initialState(), "order.create", {
    id: "order-new",
    customer: "Fictitious customer",
    channel: "Instagram",
    address: "",
    phone: "",
    lines: [{ productId: "marker", quantity: 2 }],
    paymentMethod: "COD",
  });
  assert.deepEqual(state.orders[3].lines, [
    { productId: "marker", quantity: 2, unitPriceMinor: 800 },
  ]);
  assert.equal(state.orders[3].totalMinor, 1600);
  assert.equal(state.orders[3].status, "draft");
  assert.equal(state.products[1].reserved, 0);
});

test("reservation requires delivery details and prevents the third draft overselling the two marker sets", () => {
  let state = initialState();
  assert.throws(
    () => run(state, "order.reserve", { orderId: "ig-demo" }),
    /details/i
  );
  state = run(state, "order.details", {
    orderId: "ig-demo",
    address: "Synthetic street A",
    phone: "DEMO-A",
  });
  state = run(state, "order.reserve", { orderId: "ig-demo" });
  state = run(state, "order.reserve", { orderId: "wa-demo" });
  assert.equal(state.products[1].reserved, 2);
  assert.equal(state.products[1].stock, 2);
  assert.throws(
    () => run(state, "order.reserve", { orderId: "web-demo" }),
    /stock/i
  );
  assert.throws(
    () => run(state, "order.reserve", { orderId: "wa-demo" }),
    /draft/i
  );
  assert.equal(state.orders[2].status, "draft");
});

test("packing and manual dispatch decrement physical stock once; delivery requires attributed evidence", () => {
  let state = initialState();
  assert.throws(
    () => run(state, "order.pack", { orderId: "wa-demo" }),
    /reserved/i
  );
  state = run(state, "order.reserve", { orderId: "wa-demo" });
  assert.throws(
    () =>
      run(state, "order.dispatch", {
        orderId: "wa-demo",
        reference: "Courier test",
      }),
    /packed/i
  );
  state = run(state, "order.pack", { orderId: "wa-demo" });
  state = run(state, "order.dispatch", {
    orderId: "wa-demo",
    reference: "Manual synthetic courier handover",
  });
  assert.deepEqual(
    state.products.map((p) => [p.stock, p.reserved]),
    [
      [3, 0],
      [1, 0],
      [2, 0],
    ]
  );
  assert.throws(
    () => run(state, "order.deliver", { orderId: "wa-demo", reference: "" }),
    /reference/i
  );
  state = run(state, "order.deliver", {
    orderId: "wa-demo",
    reference: "Manual synthetic delivery report",
  });
  assert.equal(state.orders[1].status, "delivered");
  assert.equal(state.orders[1].paymentStatus, "due");
  assert.equal(state.orders[1].evidence[1].actor, "owner-test");
  assert.throws(
    () =>
      run(state, "order.dispatch", { orderId: "wa-demo", reference: "again" }),
    /packed/i
  );
});

test("COD evidence tracks delivery then exact full collection then remittance, never online settlement", () => {
  let state = initialState();
  assert.throws(
    () =>
      run(state, "payment.record", {
        orderId: "wa-demo",
        status: "collected",
        amountMinor: 1800,
        reference: "Synthetic receipt",
      }),
    /delivered/i
  );
  state = run(state, "order.reserve", { orderId: "wa-demo" });
  state = run(state, "order.pack", { orderId: "wa-demo" });
  state = run(state, "order.dispatch", {
    orderId: "wa-demo",
    reference: "Synthetic handover",
  });
  state = run(state, "order.deliver", {
    orderId: "wa-demo",
    reference: "Synthetic delivery",
  });
  assert.throws(
    () =>
      run(state, "payment.record", {
        orderId: "wa-demo",
        status: "remitted",
        amountMinor: 1800,
        reference: "Synthetic bank entry",
      }),
    /collected/i
  );
  assert.throws(
    () =>
      run(state, "payment.record", {
        orderId: "wa-demo",
        status: "collected",
        amountMinor: 1700,
        reference: "Synthetic receipt",
      }),
    /amount/i
  );
  state = run(state, "payment.record", {
    orderId: "wa-demo",
    status: "collected",
    amountMinor: 1800,
    reference: "Synthetic collector report",
  });
  state = run(state, "payment.record", {
    orderId: "wa-demo",
    status: "remitted",
    amountMinor: 1800,
    reference: "Synthetic owner receipt",
  });
  assert.equal(state.orders[1].paymentStatus, "remitted");
  assert.equal(
    state.orders[1].evidence.at(-1)?.reference,
    "Synthetic owner receipt"
  );
  assert.throws(
    () =>
      run(state, "payment.record", {
        orderId: "wa-demo",
        status: "settled",
        amountMinor: 1800,
        reference: "Bad path",
      }),
    /COD/i
  );
});

test("online confirmation and settlement are separate manual records and dispatch requires confirmation", () => {
  let state = run(initialState(), "order.reserve", { orderId: "web-demo" });
  state = run(state, "order.pack", { orderId: "web-demo" });
  assert.throws(
    () =>
      run(state, "order.dispatch", {
        orderId: "web-demo",
        reference: "Synthetic courier",
      }),
    /confirmed/i
  );
  assert.throws(
    () =>
      run(state, "payment.record", {
        orderId: "web-demo",
        status: "settled",
        amountMinor: 2000,
        reference: "Synthetic settlement",
      }),
    /confirmed/i
  );
  state = run(state, "payment.record", {
    orderId: "web-demo",
    status: "confirmed",
    amountMinor: 2000,
    reference: "Owner checked synthetic provider report",
  });
  state = run(state, "order.dispatch", {
    orderId: "web-demo",
    reference: "Synthetic courier",
  });
  state = run(state, "payment.record", {
    orderId: "web-demo",
    status: "settled",
    amountMinor: 2000,
    reference: "Owner checked synthetic settlement",
  });
  assert.equal(state.orders[2].paymentStatus, "settled");
  assert.equal(state.setup.paymentsConnected, false);
  assert.throws(
    () =>
      run(state, "payment.record", {
        orderId: "web-demo",
        status: "collected",
        amountMinor: 2000,
        reference: "Wrong method",
      }),
    /online/i
  );
});

test("cancelling a packed unpaid order releases reservations but never invents a return or refund", () => {
  let state = run(initialState(), "order.reserve", { orderId: "wa-demo" });
  state = run(state, "order.pack", { orderId: "wa-demo" });
  state = run(state, "order.cancel", {
    orderId: "wa-demo",
    reference: "Synthetic customer cancellation",
  });
  assert.equal(state.orders[1].status, "cancelled");
  assert.deepEqual(
    state.products.map((p) => [p.stock, p.reserved]),
    [
      [3, 0],
      [2, 0],
      [4, 0],
    ]
  );
  assert.throws(
    () =>
      run(state, "order.cancel", { orderId: "wa-demo", reference: "Again" }),
    /cancel/i
  );
  const paid = run(initialState(), "payment.record", {
    orderId: "web-demo",
    status: "confirmed",
    amountMinor: 2000,
    reference: "Synthetic payment",
  });
  assert.throws(
    () =>
      run(paid, "order.cancel", {
        orderId: "web-demo",
        reference: "Cannot refund",
      }),
    /refund/i
  );
});

test("owner records a supplier without creating inventory or sending an external order", () => {
  const state = run(initialState(), "supplier.create", {
    id: "s2",
    name: "Fictitious Art Supply",
    contact: "Synthetic contact",
  });
  assert.equal(state.suppliers[1].name, "Fictitious Art Supply");
  assert.equal(state.purchases.length, 0);
  assert.equal(state.products[1].stock, 2);
});

test("recording a purchase does not add stock; manual receipt adds exact quantities once", () => {
  let state = run(initialState(), "purchase.create", {
    id: "po-1",
    supplierId: "supplier-demo",
    lines: [
      { productId: "marker", quantity: 5, unitCostMinor: 400 },
      { productId: "notebook", quantity: 2, unitCostMinor: 200 },
    ],
    reference: "Synthetic purchase note",
  });
  assert.equal(state.purchases[0].totalMinor, 2400);
  assert.equal(state.products[1].stock, 2);
  state = run(state, "purchase.receive", {
    purchaseId: "po-1",
    reference: "Counted synthetic delivery",
  });
  assert.deepEqual(
    state.products.map((p) => p.stock),
    [3, 7, 6]
  );
  assert.equal(state.purchases[0].status, "received");
  assert.equal(state.audit.at(-1)?.actor, "owner-test");
  assert.throws(
    () =>
      run(state, "purchase.receive", {
        purchaseId: "po-1",
        reference: "Again",
      }),
    /received/i
  );
});

test("empty shop has no fictitious business records and refuses business actions before owner setup", () => {
  const state = emptyState();
  assert.equal(state.mode, "shop");
  assert.equal(state.synthetic, false);
  assert.equal(state.setup.status, "unconfigured");
  assert.deepEqual(
    [state.products, state.orders, state.suppliers, state.purchases],
    [[], [], [], []]
  );
  assert.throws(
    () =>
      run(state, "product.create", {
        id: "paint",
        sku: "PAINT",
        name: "Fictional test paint",
        category: "Art",
        priceMinor: 100,
        lowStockAt: 1,
      }),
    /configure/i
  );
});

test("explicit owner configuration labels non-synthetic records and locks money units after records exist", () => {
  const configured = run(emptyState(), "setup.configure", {
    businessName: "Fictional Test Business",
    currency: "IQD",
    currencyDecimals: 3,
  });
  assert.equal(configured.setup.status, "configured");
  assert.equal(configured.currency, "IQD");
  assert.equal(configured.currencyDecimals, 3);
  const stocked = run(configured, "product.create", {
    id: "paint",
    sku: "PAINT",
    name: "Fictional test paint",
    category: "Art",
    priceMinor: 250000,
    lowStockAt: 1,
  });
  assert.equal(stocked.products[0].synthetic, false);
  assert.equal(stocked.audit[1].provenance, "human-recorded-shop");
  assert.throws(
    () =>
      run(stocked, "setup.configure", {
        businessName: "Relabelled",
        currency: "USD",
        currencyDecimals: 2,
      }),
    /records/i
  );
  assert.throws(
    () =>
      run(initialState(), "setup.configure", {
        businessName: "Mislabel fixtures",
        currency: "USD",
        currencyDecimals: 2,
      }),
    /preview/i
  );
  assert.throws(
    () =>
      run(emptyState(), "setup.configure", {
        businessName: "Fictional",
        currency: "ZZZ",
        currencyDecimals: 2,
      }),
    /currency/i
  );
  assert.throws(
    () =>
      run(emptyState(), "setup.configure", {
        businessName: "Fictional",
        currency: "USD",
        currencyDecimals: 7,
      }),
    /precision/i
  );
});

test("idempotent retry still rejects unknown payload fields that JSON serialization would omit", () => {
  const cmd: Command = {
    idempotencyKey: "replay-shape",
    expectedRevision: 0,
    type: "product.create",
    payload: {
      id: "paint",
      sku: "PAINT",
      name: "Paint",
      category: "Art",
      priceMinor: 100,
      lowStockAt: 0,
    },
  };
  const state = applyCommand(initialState(), cmd, "owner-test");
  const malformed = {
    ...cmd,
    payload: { ...cmd.payload, silentInjection: undefined },
  };
  assert.throws(
    () => applyCommand(state, malformed as Command, "owner-test"),
    /fields/i
  );
});

test("a configured empty shop completes purchase, stock receipt, manual order and full COD lifecycle", () => {
  let state = run(emptyState(), "setup.configure", {
    businessName: "Fictional lifecycle test",
    currency: "USD",
    currencyDecimals: 2,
  });
  state = run(state, "product.create", {
    id: "p1",
    sku: "TEST-P1",
    name: "Test toy",
    category: "Toys",
    priceMinor: 1250,
    lowStockAt: 2,
  });
  state = run(state, "supplier.create", {
    id: "s1",
    name: "Fictional test supplier",
    contact: "",
  });
  state = run(state, "purchase.create", {
    id: "po1",
    supplierId: "s1",
    lines: [{ productId: "p1", quantity: 10, unitCostMinor: 650 }],
    reference: "Fictional purchasing note",
  });
  state = run(state, "purchase.receive", {
    purchaseId: "po1",
    reference: "Fictional counted delivery",
  });
  state = run(state, "order.create", {
    id: "o1",
    customer: "Fictional test customer",
    channel: "WhatsApp",
    address: "Fictional test address",
    phone: "TEST-CONTACT",
    paymentMethod: "COD",
    lines: [{ productId: "p1", quantity: 3 }],
  });
  state = run(state, "order.reserve", { orderId: "o1" });
  state = run(state, "order.pack", { orderId: "o1" });
  state = run(state, "order.dispatch", {
    orderId: "o1",
    reference: "Fictional courier handover",
  });
  state = run(state, "order.deliver", {
    orderId: "o1",
    reference: "Fictional delivery report",
  });
  state = run(state, "payment.record", {
    orderId: "o1",
    status: "collected",
    amountMinor: 3750,
    reference: "Fictional collector receipt",
  });
  state = run(state, "payment.record", {
    orderId: "o1",
    status: "remitted",
    amountMinor: 3750,
    reference: "Fictional owner receipt",
  });
  assert.deepEqual(
    [
      state.products[0].stock,
      state.products[0].reserved,
      state.orders[0].totalMinor,
      state.orders[0].paymentStatus,
    ],
    [7, 0, 3750, "remitted"]
  );
  assert.equal(state.audit.length, 12);
  assert.ok(
    state.audit.every((event) => event.provenance === "human-recorded-shop")
  );
  assert.equal(initialState().products[0].stock, 3);
});

test("invalid nested quantities, unknown products, duplicate lines and overflow cannot produce orders or purchases", () => {
  const state = initialState();
  const base = {
    id: "bad",
    customer: "Fictional customer",
    channel: "Website",
    address: "Synthetic address",
    phone: "TEST",
    paymentMethod: "online",
  };
  for (const items of [
    [{ productId: "marker", quantity: -1 }],
    [{ productId: "marker", quantity: 0.5 }],
    [{ productId: "missing", quantity: 1 }],
    [{ productId: "marker", quantity: 1, priceMinor: 1 }],
    [
      { productId: "marker", quantity: 1 },
      { productId: "marker", quantity: 1 },
    ],
    [{ productId: "marker", quantity: Number.MAX_SAFE_INTEGER }],
  ]) {
    assert.throws(() => run(state, "order.create", { ...base, lines: items }));
  }
  assert.throws(() =>
    run(state, "purchase.create", {
      id: "bad-po",
      supplierId: "supplier-demo",
      lines: [
        {
          productId: "marker",
          quantity: Number.MAX_SAFE_INTEGER,
          unitCostMinor: 2,
        },
      ],
      reference: "Synthetic note",
    })
  );
  assert.equal(state.orders.length, 3);
  assert.equal(state.purchases.length, 0);
  assert.equal(state.audit.length, 0);
});

test("catalog correction keeps identity, stock and historical prices while new orders use the new price", () => {
  let state = run(initialState(), "purchase.create", {
    id: "catalog-po",
    supplierId: "supplier-demo",
    lines: [{ productId: "marker", quantity: 4, unitCostMinor: 400 }],
    reference: "Fictional supplier note",
  });
  const before = structuredClone(state);
  state = run(state, "product.update", {
    productId: "marker",
    name: "Corrected fictional markers",
    sku: "DEMO-MARKER-NEW",
    priceMinor: 950,
  });
  assert.deepEqual(state.products[1], {
    id: "marker",
    name: "Corrected fictional markers",
    sku: "DEMO-MARKER-NEW",
    category: "Art",
    priceMinor: 950,
    stock: 2,
    reserved: 0,
    lowStockAt: 2,
    synthetic: true,
  });
  assert.equal(before.products[1].priceMinor, 800);
  assert.equal(state.orders[0].lines[1].unitPriceMinor, 800);
  assert.equal(state.orders[0].totalMinor, 2000);
  assert.equal(state.purchases[0].lines[0].unitCostMinor, 400);
  state = run(state, "order.create", {
    id: "new-priced-order",
    customer: "Fictional test",
    channel: "Instagram",
    address: "",
    phone: "",
    lines: [{ productId: "marker", quantity: 2 }],
    paymentMethod: "COD",
  });
  assert.equal(state.orders.at(-1)?.totalMinor, 1900);
  assert.throws(
    () =>
      run(state, "product.update", {
        productId: "marker",
        name: "Duplicate SKU",
        sku: "demo-block",
        priceMinor: 950,
      }),
    /SKU/i
  );
  assert.throws(
    () =>
      run(state, "product.update", {
        productId: "marker",
        name: "Bad price",
        sku: "DEMO-MARKER-NEW",
        priceMinor: 1.5,
      }),
    /price/i
  );
  assert.throws(
    () =>
      run(state, "product.update", {
        productId: "marker",
        name: "Stock injection",
        sku: "DEMO-MARKER-NEW",
        priceMinor: 950,
        stock: 50,
      }),
    /fields/i
  );
});

test("SKU uniqueness is case and surrounding-whitespace insensitive for both create and correction", () => {
  const state = initialState();
  assert.throws(
    () =>
      run(state, "product.create", {
        id: "duplicate",
        sku: " demo-marker ",
        name: "Duplicate",
        category: "Art",
        priceMinor: 100,
        lowStockAt: 0,
      }),
    /SKU/i
  );
  assert.throws(
    () =>
      run(state, "product.update", {
        productId: "block",
        sku: " DEMO-MARKER ",
        name: "Duplicate",
        priceMinor: 100,
      }),
    /SKU/i
  );
});

test("physical count records opening stock and corrections with before/after evidence, never a phantom purchase", () => {
  let state = run(emptyState(), "setup.configure", {
    businessName: "Fictional counts test",
    currency: "USD",
    currencyDecimals: 2,
  });
  state = run(state, "product.create", {
    id: "counted",
    sku: "COUNTED",
    name: "Fictional old stock",
    category: "Art",
    priceMinor: 100,
    lowStockAt: 0,
  });
  state = run(state, "stock.adjust", {
    productId: "counted",
    countedStock: 7,
    reference: "Opening physical count of existing saleable goods",
  });
  assert.equal(state.products[0].stock, 7);
  assert.equal(state.purchases.length, 0);
  assert.deepEqual(state.audit.at(-1)?.stockChange, {
    before: 0,
    after: 7,
    delta: 7,
    reference: "Opening physical count of existing saleable goods",
  });
  state = run(state, "stock.adjust", {
    productId: "counted",
    countedStock: 5,
    reference: "Two damaged goods excluded from saleable count",
  });
  assert.deepEqual(state.audit.at(-1)?.stockChange, {
    before: 7,
    after: 5,
    delta: -2,
    reference: "Two damaged goods excluded from saleable count",
  });
  let reserved = run(initialState(), "order.reserve", { orderId: "wa-demo" });
  assert.throws(
    () =>
      run(reserved, "stock.adjust", {
        productId: "marker",
        countedStock: 0,
        reference: "Fictional short count",
      }),
    /reserved/i
  );
  for (const countedStock of [-1, 0.5, Number.MAX_SAFE_INTEGER + 1])
    assert.throws(() =>
      run(state, "stock.adjust", {
        productId: "counted",
        countedStock,
        reference: "Invalid count",
      })
    );
  assert.throws(
    () =>
      run(state, "stock.adjust", {
        productId: "counted",
        countedStock: 3,
        reference: "",
      }),
    /reference/i
  );
  reserved = run(reserved, "stock.adjust", {
    productId: "marker",
    countedStock: 1,
    reference: "Only reserved unit remains",
  });
  assert.deepEqual(
    [reserved.products[1].stock, reserved.products[1].reserved],
    [1, 1]
  );
});

test("server-supplied recording time is preserved on idempotent replay and cannot be supplied by command payload", () => {
  const command: Command = {
    type: "stock.adjust",
    idempotencyKey: "clock-count",
    expectedRevision: 0,
    payload: {
      productId: "marker",
      countedStock: 3,
      reference: "Fictional count",
    },
  };
  const state = applyCommand(
    initialState(),
    command,
    "owner-test",
    "2026-10-04T10:00:00.000Z"
  );
  assert.equal(state.audit[0].recordedAt, "2026-10-04T10:00:00.000Z");
  const replay = applyCommand(
    state,
    command,
    "owner-test",
    "2026-10-04T11:00:00.000Z"
  );
  assert.equal(replay.audit[0].recordedAt, "2026-10-04T10:00:00.000Z");
  assert.deepEqual(replay, state);
  assert.throws(
    () => applyCommand(initialState(), command, "owner-test", "not-a-time"),
    /timestamp/i
  );
  assert.throws(
    () =>
      applyCommand(
        initialState(),
        { ...command, recordedAt: "2026-10-04T10:00:00.000Z" } as Command,
        "owner-test"
      ),
    /fields/i
  );
});

test("known legacy purchase states project receipt counts without changing stock, money, evidence or inventing times", () => {
  const legacy = initialState();
  legacy.schemaVersion = 1;
  legacy.purchases = [
    {
      id: "old-open",
      supplierId: "supplier-demo",
      lines: [{ productId: "marker", quantity: 10, unitCostMinor: 400 }],
      totalMinor: 4000,
      status: "recorded",
      reference: "Legacy supplier note",
      synthetic: true,
    },
    {
      id: "old-received",
      supplierId: "supplier-demo",
      lines: [{ productId: "notebook", quantity: 5, unitCostMinor: 200 }],
      totalMinor: 1000,
      status: "received",
      reference: "Legacy purchase note",
      receiptReference: "Legacy complete receipt",
      synthetic: true,
    },
  ];
  const original = structuredClone(legacy);
  const current = normalizeState(legacy);
  assert.equal(current.schemaVersion, 2);
  assert.deepEqual(
    current.purchases.map((p) => [
      p.lines[0].receivedQuantity,
      p.lines[0].remainingQuantity,
    ]),
    [
      [0, 10],
      [5, 0],
    ]
  );
  assert.deepEqual(
    current.purchases.map((p) => p.receipts),
    [[], []]
  );
  assert.equal(
    current.purchases[1].receiptReference,
    "Legacy complete receipt"
  );
  assert.deepEqual(current.products, original.products);
  assert.deepEqual(current.orders, original.orders);
  assert.deepEqual(current.audit, original.audit);
  assert.equal(current.purchases[1].totalMinor, 1000);
  assert.deepEqual(legacy, original);
  assert.deepEqual(normalizeState(current), current);
  assert.throws(
    () =>
      normalizeState({ ...legacy, schemaVersion: 99 } as unknown as ShopState),
    /schema/i
  );
  assert.throws(
    () => normalizeState({ ...legacy, schemaVersion: 2 }),
    /receipt/i
  );
});

test("quantity-specific receipts add only counted arrivals and complete a ten-unit purchase as four then six", () => {
  let state = run(initialState(), "purchase.create", {
    id: "partial-po",
    supplierId: "supplier-demo",
    lines: [{ productId: "marker", quantity: 10, unitCostMinor: 400 }],
    reference: "Fictional purchase of ten",
  });
  const first: Command = {
    type: "purchase.receive-lines",
    expectedRevision: 1,
    idempotencyKey: "first-four",
    payload: {
      purchaseId: "partial-po",
      lines: [{ productId: "marker", quantity: 4 }],
      reference: "Fictional arrival one: four counted",
    },
  };
  state = applyCommand(state, first, "owner-test", "2026-10-04T10:00:00.000Z");
  assert.deepEqual(
    [
      state.products[1].stock,
      state.purchases[0].status,
      state.purchases[0].lines[0].receivedQuantity,
      state.purchases[0].lines[0].remainingQuantity,
    ],
    [6, "partially-received", 4, 6]
  );
  assert.deepEqual(
    applyCommand(state, first, "owner-test", "2026-10-04T11:00:00.000Z"),
    state
  );
  assert.equal(state.purchases[0].receipts?.length, 1);
  assert.equal(
    state.purchases[0].receipts?.[0].recordedAt,
    "2026-10-04T10:00:00.000Z"
  );
  assert.throws(
    () =>
      run(state, "purchase.receive", {
        purchaseId: "partial-po",
        reference: "Cannot silently reinterpret original full receipt",
      }),
    /partial/i
  );
  state = run(state, "purchase.receive-lines", {
    purchaseId: "partial-po",
    lines: [{ productId: "marker", quantity: 6 }],
    reference: "Fictional arrival two: six counted",
  });
  assert.deepEqual(
    [
      state.products[1].stock,
      state.purchases[0].status,
      state.purchases[0].lines[0].receivedQuantity,
      state.purchases[0].lines[0].remainingQuantity,
    ],
    [12, "received", 10, 0]
  );
  assert.equal(state.purchases[0].totalMinor, 4000);
  assert.equal(state.purchases[0].receipts?.length, 2);
  assert.throws(
    () =>
      run(state, "purchase.receive-lines", {
        purchaseId: "partial-po",
        lines: [{ productId: "marker", quantity: 1 }],
        reference: "Extra",
      }),
    /received|remaining/i
  );
});

test("receipts reject duplicate, unknown, fractional, over-remaining and forged lines atomically", () => {
  const state = run(initialState(), "purchase.create", {
    id: "bounded-po",
    supplierId: "supplier-demo",
    lines: [
      { productId: "marker", quantity: 10, unitCostMinor: 400 },
      { productId: "notebook", quantity: 2, unitCostMinor: 200 },
    ],
    reference: "Fictional mixed purchase",
  });
  const original = structuredClone(state);
  for (const receiptLines of [
    [],
    [{ productId: "marker", quantity: 11 }],
    [{ productId: "marker", quantity: -1 }],
    [{ productId: "marker", quantity: 0 }],
    [{ productId: "marker", quantity: 0.5 }],
    [
      { productId: "marker", quantity: 1 },
      { productId: "marker", quantity: 1 },
    ],
    [
      { productId: "marker", quantity: 1 },
      { productId: "block", quantity: 1 },
    ],
    [{ productId: "marker", quantity: 1, unitCostMinor: 1 }],
  ]) {
    assert.throws(() =>
      run(state, "purchase.receive-lines", {
        purchaseId: "bounded-po",
        lines: receiptLines,
        reference: "Invalid receipt",
      })
    );
    assert.deepEqual(state, original);
  }
  const received = run(state, "purchase.receive-lines", {
    purchaseId: "bounded-po",
    lines: [{ productId: "notebook", quantity: 2 }],
    reference: "Only notebooks physically arrived",
  });
  assert.deepEqual(
    received.products.map((p) => p.stock),
    [3, 2, 6]
  );
  assert.deepEqual(
    received.purchases[0].lines.map((line) => line.remainingQuantity),
    [10, 0]
  );
  assert.equal(received.purchases[0].status, "partially-received");
  assert.throws(
    () =>
      run(received, "purchase.receive-lines", {
        purchaseId: "bounded-po",
        lines: [{ productId: "notebook", quantity: 1 }],
        reference: "Too many notebooks",
      }),
    /remaining/i
  );
});

test("unsuccessful unpaid COD delivery is distinct from full saleable physical return and never creates a refund", () => {
  let state = run(initialState(), "order.reserve", { orderId: "wa-demo" });
  state = run(state, "order.pack", { orderId: "wa-demo" });
  state = run(state, "order.dispatch", {
    orderId: "wa-demo",
    reference: "Fictional courier handover",
  });
  assert.throws(
    () =>
      run(state, "order.return-received", {
        orderId: "wa-demo",
        condition: "all-saleable",
        reference: "Failure not yet recorded",
      }),
    /failed/i
  );
  state = run(state, "order.delivery-failed", {
    orderId: "wa-demo",
    reference: "Fictional customer refused unpaid delivery",
  });
  assert.deepEqual(
    [state.orders[1].status, state.orders[1].paymentStatus],
    ["delivery-failed", "due"]
  );
  assert.deepEqual(
    state.products.map((p) => p.stock),
    [3, 1, 2]
  );
  assert.throws(
    () =>
      run(state, "order.return-received", {
        orderId: "wa-demo",
        condition: "damaged",
        reference: "One toy damaged",
      }),
    /saleable/i
  );
  assert.throws(
    () =>
      run(state, "order.return-received", {
        orderId: "wa-demo",
        condition: "missing",
        reference: "Some goods missing",
      }),
    /saleable/i
  );
  const returnCommand: Command = {
    type: "order.return-received",
    expectedRevision: state.revision,
    idempotencyKey: "full-return",
    payload: {
      orderId: "wa-demo",
      condition: "all-saleable",
      reference: "All original goods physically counted and saleable",
    },
  };
  state = applyCommand(
    state,
    returnCommand,
    "owner-test",
    "2026-10-04T12:00:00.000Z"
  );
  assert.deepEqual(
    [state.orders[1].status, state.orders[1].paymentStatus],
    ["returned", "not-due"]
  );
  assert.deepEqual(
    state.products.map((p) => [p.stock, p.reserved]),
    [
      [3, 0],
      [2, 0],
      [4, 0],
    ]
  );
  assert.equal(
    state.orders[1].evidence.at(-1)?.recordedAt,
    "2026-10-04T12:00:00.000Z"
  );
  assert.deepEqual(applyCommand(state, returnCommand, "owner-test"), state);
  assert.throws(
    () => run(state, "order.return-received", returnCommand.payload),
    /failed/i
  );
  assert.throws(
    () =>
      run(state, "payment.record", {
        orderId: "wa-demo",
        status: "collected",
        amountMinor: 1800,
        reference: "No collection after return",
      }),
    /returned|delivered/i
  );
});

test("legacy compatibility refuses newer order states mislabeled as old schema instead of guessing history", () => {
  const mislabeled = initialState();
  mislabeled.schemaVersion = 1;
  mislabeled.orders[1].status = "returned";
  mislabeled.orders[1].paymentStatus = "not-due";
  assert.throws(
    () => normalizeState(mislabeled),
    /legacy.*order|order.*schema/i
  );
});

test("failed-delivery recovery rejects paid, undispatched, repeated, partial and overflowing returns without changing history", () => {
  assert.throws(
    () =>
      run(initialState(), "order.delivery-failed", {
        orderId: "wa-demo",
        reference: "Not dispatched",
      }),
    /dispatched/i
  );
  let online = run(initialState(), "payment.record", {
    orderId: "web-demo",
    status: "confirmed",
    amountMinor: 2000,
    reference: "Fictional confirmation",
  });
  online = run(online, "order.reserve", { orderId: "web-demo" });
  online = run(online, "order.pack", { orderId: "web-demo" });
  online = run(online, "order.dispatch", {
    orderId: "web-demo",
    reference: "Fictional prepaid handover",
  });
  assert.throws(
    () =>
      run(online, "order.delivery-failed", {
        orderId: "web-demo",
        reference: "Prepaid return requires separate workflow",
      }),
    /unpaid COD/i
  );
  let failed = run(initialState(), "order.reserve", { orderId: "wa-demo" });
  failed = run(failed, "order.pack", { orderId: "wa-demo" });
  failed = run(failed, "order.dispatch", {
    orderId: "wa-demo",
    reference: "Fictional handover",
  });
  failed = run(failed, "order.delivery-failed", {
    orderId: "wa-demo",
    reference: "Fictional refusal",
  });
  const original = structuredClone(failed);
  assert.throws(
    () =>
      run(failed, "order.delivery-failed", {
        orderId: "wa-demo",
        reference: "Repeated failure",
      }),
    /dispatched/i
  );
  assert.throws(
    () =>
      run(failed, "order.return-received", {
        orderId: "wa-demo",
        condition: "all-saleable",
        reference: "Cannot override quantities",
        lines: [{ productId: "marker", quantity: 1 }],
      }),
    /fields/i
  );
  assert.throws(
    () =>
      run(failed, "order.return-received", {
        orderId: "wa-demo",
        condition: "partial",
        reference: "Only one item came back",
      }),
    /partial/i
  );
  assert.throws(
    () =>
      run(failed, "order.deliver", {
        orderId: "wa-demo",
        reference: "Cannot silently overwrite failure",
      }),
    /dispatched/i
  );
  assert.deepEqual(failed, original);
  const huge = run(failed, "stock.adjust", {
    productId: "marker",
    countedStock: Number.MAX_SAFE_INTEGER,
    reference: "Fictional overflow guard fixture",
  });
  const beforeOverflow = structuredClone(huge);
  assert.throws(
    () =>
      run(huge, "order.return-received", {
        orderId: "wa-demo",
        condition: "all-saleable",
        reference: "Would overflow safe quantity",
      }),
    /stock/i
  );
  assert.deepEqual(huge, beforeOverflow);
});

test("new catalog and count commands keep the same stale-revision and changed-key protections", () => {
  const commands: Command[] = [
    {
      type: "product.update",
      expectedRevision: 0,
      idempotencyKey: "new-catalog",
      payload: {
        productId: "marker",
        name: "Fictional corrected name",
        sku: "DEMO-MARKER",
        priceMinor: 900,
      },
    },
    {
      type: "stock.adjust",
      expectedRevision: 0,
      idempotencyKey: "new-count",
      payload: {
        productId: "marker",
        countedStock: 5,
        reference: "Fictional count",
      },
    },
  ];
  for (const command of commands) {
    const updated = applyCommand(initialState(), command, "owner-test");
    assert.equal(updated.revision, 1);
    assert.deepEqual(applyCommand(updated, command, "owner-test"), updated);
    assert.throws(
      () =>
        applyCommand(
          updated,
          { ...command, idempotencyKey: `${command.idempotencyKey}-new` },
          "owner-test"
        ),
      /State changed/i
    );
    assert.throws(
      () =>
        applyCommand(
          updated,
          { ...command, expectedRevision: 1 },
          "owner-test"
        ),
      /key/i
    );
    assert.equal(updated.audit.length, 1);
  }
});
