import { createHash } from "node:crypto";

const TENANT_ID = "tenant.fictitious.cedar-steam";
const VERSION_SET = Object.freeze({
  kernel: "adaptive-business-kernel@1.0.0",
  configurationSchema: "adaptive-blueprint-schema@1.0.0",
  compiler: "adaptive-blueprint-compiler@1.0.0",
  policy: "financial-stock-audit@1.0.0",
});

const CAPABILITIES = Object.freeze([
  "party-registry",
  "catalog",
  "purchasing",
  "receiving",
  "inventory",
  "ordering",
  "sales",
  "payment",
  "cash",
  "ledger",
  "kitchen-operations",
].map(identity => ({ identity, version: "1.0.0" })));

const BLUEPRINT_CONTENT = Object.freeze({
  tenantId: TENANT_ID,
  blueprintId: "blueprint.cedar-steam",
  configurationSchema: VERSION_SET.configurationSchema,
  capabilities: CAPABILITIES,
  targetProfiles: [
    {
      identity: "profile.retail",
      sandboxId: "sandbox.retail",
      locationId: "location.retail",
      visibleCapabilities: [
        "party-registry", "catalog", "purchasing", "receiving", "inventory",
        "ordering", "sales", "payment", "cash", "ledger",
      ],
      roles: ["owner", "buyer", "receiver", "cashier"],
      scenarioId: "scenario.retail-golden-transaction",
    },
    {
      identity: "profile.cafe",
      sandboxId: "sandbox.cafe",
      locationId: "location.cafe",
      visibleCapabilities: [
        "party-registry", "catalog", "inventory", "ordering", "sales",
        "payment", "cash", "ledger", "kitchen-operations",
      ],
      roles: ["owner", "cafe-cashier", "kitchen-operator"],
      scenarioId: "scenario.cafe-order-to-kitchen",
    },
  ],
  policies: {
    currency: "USD",
    precision: "minor-unit-integer",
    inventoryCosting: "moving-weighted-average",
    accounting: "balanced-posting-sets",
  },
  exclusions: [
    "tables", "reservations", "delivery", "tips", "loyalty",
    "advanced-recipe-costing", "tenant-runtime-code",
  ],
});

function contentIdentity(value) {
  return `sha256:${createHash("sha256").update(JSON.stringify(value)).digest("hex")}`;
}

export const BLUEPRINT = Object.freeze({
  reference: Object.freeze({
    tenantId: TENANT_ID,
    blueprintId: "blueprint.cedar-steam",
    versionId: "blueprint-version.shared-v1",
    versionNumber: 1,
  }),
  contentIdentity: contentIdentity(BLUEPRINT_CONTENT),
  content: BLUEPRINT_CONTENT,
  versionSet: VERSION_SET,
});

const FIXTURE = Object.freeze({
  retail: {
    targetId: "retail",
    profileId: "profile.retail",
    commands: [
      {
        identity: "command.retail.01.purchase",
        action: "purchase.confirm",
        input: {
          recordId: "purchase-order.retail.01",
          supplierId: "party.supplier.retail",
          items: [{ itemId: "catalog.widget", quantity: 10, unit: "each", unitCost: 500 }],
        },
      },
      {
        identity: "command.retail.02.receive",
        action: "receipt.accept",
        input: { recordId: "supplier-receipt.retail.01", purchaseOrderId: "purchase-order.retail.01" },
      },
      {
        identity: "command.retail.03.order",
        action: "order.accept",
        input: {
          recordId: "order.retail.01",
          lines: [{ itemId: "catalog.widget", quantity: 4, unit: "each", unitPrice: 1200 }],
        },
      },
      {
        identity: "command.retail.04.fulfill",
        action: "sale.fulfill",
        input: { recordId: "sale.retail.01", orderId: "order.retail.01" },
      },
      {
        identity: "command.retail.05.payment",
        action: "payment.accept",
        input: { recordId: "payment.retail.01", orderId: "order.retail.01", amount: 4800, method: "cash" },
      },
    ],
  },
  cafe: {
    targetId: "cafe",
    profileId: "profile.cafe",
    commands: [
      {
        identity: "command.cafe.01.purchase",
        action: "purchase.confirm",
        input: {
          recordId: "purchase-order.cafe.01",
          supplierId: "party.supplier.cafe",
          items: [
            { itemId: "ingredient.beans", quantity: 1000, unit: "g", unitCost: 2 },
            { itemId: "ingredient.milk", quantity: 2000, unit: "ml", unitCost: 1 },
          ],
        },
      },
      {
        identity: "command.cafe.02.receive",
        action: "receipt.accept",
        input: { recordId: "supplier-receipt.cafe.01", purchaseOrderId: "purchase-order.cafe.01" },
      },
      {
        identity: "command.cafe.03.order",
        action: "order.accept",
        input: {
          recordId: "order.cafe.01",
          lines: [{ itemId: "menu.cortado", quantity: 1, unit: "each", unitPrice: 900, modifiers: ["modifier.extra-shot"] }],
        },
      },
      {
        identity: "command.cafe.04.kitchen-accept",
        action: "kitchen.accept",
        input: {
          recordId: "kitchen-ticket.cafe.01",
          orderId: "order.cafe.01",
          ingredients: [
            { itemId: "ingredient.beans", quantity: 27, unit: "g" },
            { itemId: "ingredient.milk", quantity: 120, unit: "ml" },
          ],
        },
      },
      { identity: "command.cafe.05.kitchen-prepare", action: "kitchen.prepare", input: { recordId: "kitchen-ticket.cafe.01" } },
      { identity: "command.cafe.06.kitchen-ready", action: "kitchen.ready", input: { recordId: "kitchen-ticket.cafe.01" } },
      { identity: "command.cafe.07.kitchen-fulfill", action: "kitchen.fulfill", input: { recordId: "kitchen-ticket.cafe.01" } },
      {
        identity: "command.cafe.08.payment",
        action: "payment.accept",
        input: { recordId: "payment.cafe.01", orderId: "order.cafe.01", amount: 900, method: "cash" },
      },
    ],
  },
});

function emptyTarget(profile, generationNumber = 1) {
  return {
    identity: profile.sandboxId,
    profileId: profile.identity,
    tenantId: TENANT_ID,
    locationId: profile.locationId,
    generationId: `generation.${profile.sandboxId}.${generationNumber}`,
    generationNumber,
    appliedBlueprint: null,
    activeConfiguration: null,
    stepIndex: 0,
    records: [],
    events: [],
    movements: [],
    postingSets: [],
    commandResults: [],
  };
}

export function createState() {
  return {
    blueprint: BLUEPRINT,
    lifecycle: "Draft",
    approval: null,
    effectiveBlueprint: null,
    targets: Object.fromEntries(BLUEPRINT.content.targetProfiles.map(profile => [profile.sandboxId.split(".").at(-1), emptyTarget(profile)])),
    resetRecords: [],
    lastResult: { disposition: "Ready", message: "Explicitly approve the immutable Blueprint before compilation." },
  };
}

function clone(value) {
  return structuredClone(value);
}

function eventFor(target, command, kind) {
  return {
    identity: `event.${command.identity}`,
    kind,
    tenantId: target.tenantId,
    locationId: target.locationId,
    generationId: target.generationId,
    causation: command.identity,
  };
}

function recordFor(target, identity, kind, lifecycle, data, eventId) {
  return { identity, kind, lifecycle, tenantId: target.tenantId, locationId: target.locationId, generationId: target.generationId, eventId, ...data };
}

function findRecord(target, identity, kind) {
  return target.records.find(record => record.identity === identity && (!kind || record.kind === kind));
}

function createPostingSet(target, event, identity, entries) {
  const debit = entries.filter(entry => entry.side === "debit").reduce((sum, entry) => sum + entry.amount, 0);
  const credit = entries.filter(entry => entry.side === "credit").reduce((sum, entry) => sum + entry.amount, 0);
  if (debit !== credit || debit <= 0) throw new Error("Posting Set must contain equal positive debit and credit totals.");
  return {
    identity,
    tenantId: target.tenantId,
    locationId: target.locationId,
    generationId: target.generationId,
    eventId: event.identity,
    currency: "USD",
    entries: entries.map((entry, index) => ({ identity: `${identity}.entry.${index + 1}`, ...entry })),
  };
}

export function stockPosition(target, itemId) {
  const relevant = target.movements.filter(movement => movement.itemId === itemId);
  const quantity = relevant.reduce((sum, movement) => sum + (movement.destination === target.locationId ? movement.quantity : -movement.quantity), 0);
  const value = relevant.reduce((sum, movement) => sum + (movement.destination === target.locationId ? movement.quantity * movement.unitCost : -movement.quantity * movement.unitCost), 0);
  return { itemId, quantity, unit: relevant[0]?.unit ?? "", value };
}

export function ledgerBalances(target) {
  const balances = {};
  for (const postingSet of target.postingSets) {
    for (const entry of postingSet.entries) {
      balances[entry.account] ??= 0;
      balances[entry.account] += entry.side === "debit" ? entry.amount : -entry.amount;
    }
  }
  return balances;
}

const handlers = {
  "purchase.confirm"(target, command) {
    if (findRecord(target, command.input.recordId)) throw new Error("Purchase Order identity already exists.");
    const event = eventFor(target, command, "purchase-order-confirmed");
    target.events.push(event);
    target.records.push(recordFor(target, command.input.recordId, "Purchase Order", "confirmed", { supplierId: command.input.supplierId, items: command.input.items }, event.identity));
  },

  "receipt.accept"(target, command) {
    const purchase = findRecord(target, command.input.purchaseOrderId, "Purchase Order");
    if (!purchase || purchase.lifecycle !== "confirmed") throw new Error("A confirmed Purchase Order is required.");
    const event = eventFor(target, command, "supplier-receipt-accepted");
    target.events.push(event);
    target.records.push(recordFor(target, command.input.recordId, "Supplier Receipt", "accepted", { purchaseOrderId: purchase.identity, items: purchase.items }, event.identity));
    const entries = [];
    purchase.items.forEach((item, index) => {
      target.movements.push({
        identity: `movement.${command.identity}.${index + 1}`,
        tenantId: target.tenantId,
        locationId: target.locationId,
        generationId: target.generationId,
        eventId: event.identity,
        itemId: item.itemId,
        quantity: item.quantity,
        unit: item.unit,
        unitCost: item.unitCost,
        source: "boundary.supplier",
        destination: target.locationId,
      });
      const amount = item.quantity * item.unitCost;
      entries.push({ side: "debit", account: "inventory", amount });
      entries.push({ side: "credit", account: "accounts-payable", amount });
    });
    target.postingSets.push(createPostingSet(target, event, `posting.${command.identity}`, entries));
  },

  "order.accept"(target, command) {
    if (findRecord(target, command.input.recordId)) throw new Error("Order identity already exists.");
    const event = eventFor(target, command, "order-accepted");
    target.events.push(event);
    target.records.push(recordFor(target, command.input.recordId, "Order", "accepted", { lines: command.input.lines }, event.identity));
  },

  "sale.fulfill"(target, command) {
    const order = findRecord(target, command.input.orderId, "Order");
    if (!order || order.lifecycle !== "accepted") throw new Error("An accepted Order is required.");
    const event = eventFor(target, command, "sale-fulfilled");
    const commercialAmount = order.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
    let costAmount = 0;
    order.lines.forEach((line, index) => {
      const position = stockPosition(target, line.itemId);
      if (position.quantity < line.quantity) throw new Error(`Insufficient stock for ${line.itemId}.`);
      const unitCost = position.value / position.quantity;
      if (!Number.isInteger(unitCost)) throw new Error("Prototype requires exact integer moving-average unit cost.");
      costAmount += line.quantity * unitCost;
      target.movements.push({
        identity: `movement.${command.identity}.${index + 1}`,
        tenantId: target.tenantId,
        locationId: target.locationId,
        generationId: target.generationId,
        eventId: event.identity,
        itemId: line.itemId,
        quantity: line.quantity,
        unit: line.unit,
        unitCost,
        source: target.locationId,
        destination: "boundary.customer",
      });
    });
    order.lifecycle = "fulfilled";
    order.eventId = event.identity;
    target.events.push(event);
    target.records.push(recordFor(target, command.input.recordId, "Sale", "fulfilled", { orderId: order.identity, amount: commercialAmount }, event.identity));
    target.postingSets.push(createPostingSet(target, event, `posting.${command.identity}.commercial`, [
      { side: "debit", account: "accounts-receivable", amount: commercialAmount },
      { side: "credit", account: "sales-revenue", amount: commercialAmount },
    ]));
    target.postingSets.push(createPostingSet(target, event, `posting.${command.identity}.cost`, [
      { side: "debit", account: "cost-of-goods-sold", amount: costAmount },
      { side: "credit", account: "inventory", amount: costAmount },
    ]));
  },

  "kitchen.accept"(target, command) {
    const order = findRecord(target, command.input.orderId, "Order");
    if (!order || order.lifecycle !== "accepted") throw new Error("An accepted Order is required.");
    const event = eventFor(target, command, "kitchen-ticket-accepted");
    target.events.push(event);
    target.records.push(recordFor(target, command.input.recordId, "Kitchen Ticket", "accepted", { orderId: order.identity, ingredients: command.input.ingredients }, event.identity));
  },

  "kitchen.prepare"(target, command) {
    transitionKitchen(target, command, "accepted", "preparing");
  },

  "kitchen.ready"(target, command) {
    transitionKitchen(target, command, "preparing", "ready");
  },

  "kitchen.fulfill"(target, command) {
    const ticket = findRecord(target, command.input.recordId, "Kitchen Ticket");
    if (!ticket || ticket.lifecycle !== "ready") throw new Error("A ready Kitchen Ticket is required.");
    const order = findRecord(target, ticket.orderId, "Order");
    const event = eventFor(target, command, "kitchen-ticket-fulfilled");
    let costAmount = 0;
    ticket.ingredients.forEach((ingredient, index) => {
      const position = stockPosition(target, ingredient.itemId);
      if (position.quantity < ingredient.quantity) throw new Error(`Insufficient ingredient ${ingredient.itemId}.`);
      const unitCost = position.value / position.quantity;
      if (!Number.isInteger(unitCost)) throw new Error("Prototype requires exact integer moving-average unit cost.");
      costAmount += ingredient.quantity * unitCost;
      target.movements.push({
        identity: `movement.${command.identity}.${index + 1}`,
        tenantId: target.tenantId,
        locationId: target.locationId,
        generationId: target.generationId,
        eventId: event.identity,
        itemId: ingredient.itemId,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        unitCost,
        source: target.locationId,
        destination: "boundary.consumption",
      });
    });
    const commercialAmount = order.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
    ticket.lifecycle = "fulfilled";
    ticket.eventId = event.identity;
    order.lifecycle = "fulfilled";
    order.eventId = event.identity;
    target.events.push(event);
    target.records.push(recordFor(target, `sale.${order.identity}`, "Sale", "fulfilled", { orderId: order.identity, amount: commercialAmount }, event.identity));
    target.postingSets.push(createPostingSet(target, event, `posting.${command.identity}.commercial`, [
      { side: "debit", account: "accounts-receivable", amount: commercialAmount },
      { side: "credit", account: "sales-revenue", amount: commercialAmount },
    ]));
    target.postingSets.push(createPostingSet(target, event, `posting.${command.identity}.cost`, [
      { side: "debit", account: "cost-of-goods-sold", amount: costAmount },
      { side: "credit", account: "inventory", amount: costAmount },
    ]));
  },

  "payment.accept"(target, command) {
    const order = findRecord(target, command.input.orderId, "Order");
    if (!order || order.lifecycle !== "fulfilled") throw new Error("A fulfilled Order is required before Payment.");
    const balances = ledgerBalances(target);
    if ((balances["accounts-receivable"] ?? 0) < command.input.amount) throw new Error("Payment exceeds the outstanding receivable.");
    const event = eventFor(target, command, "payment-accepted");
    target.events.push(event);
    target.records.push(recordFor(target, command.input.recordId, "Payment", "accepted", { orderId: order.identity, amount: command.input.amount, method: command.input.method }, event.identity));
    target.postingSets.push(createPostingSet(target, event, `posting.${command.identity}`, [
      { side: "debit", account: "cash", amount: command.input.amount },
      { side: "credit", account: "accounts-receivable", amount: command.input.amount },
    ]));
  },
};

function transitionKitchen(target, command, expected, next) {
  const ticket = findRecord(target, command.input.recordId, "Kitchen Ticket");
  if (!ticket || ticket.lifecycle !== expected) throw new Error(`Kitchen Ticket must be ${expected}.`);
  const event = eventFor(target, command, `kitchen-ticket-${next}`);
  ticket.lifecycle = next;
  ticket.eventId = event.identity;
  target.events.push(event);
}

export function approveBlueprint(state) {
  const next = clone(state);
  if (next.lifecycle !== "Draft") return withLast(next, "Rejected", "Only the exact Draft may be explicitly approved.");
  next.lifecycle = "Approved";
  next.approval = { identity: "blueprint-approval.shared-v1", reference: next.blueprint.reference, contentIdentity: next.blueprint.contentIdentity };
  return withLast(next, "Accepted", "Explicit approval bound the exact Blueprint Reference and Content Identity.");
}

export function compileAndProvision(state) {
  const next = clone(state);
  if (next.lifecycle !== "Approved" || !next.approval) return withLast(next, "Rejected", "Compilation for provisioning requires the exact Approved Blueprint.");
  const available = new Set(next.blueprint.content.capabilities.map(capability => capability.identity));
  next.effectiveBlueprint = {
    identity: "effective-blueprint.shared-v1",
    sourceReference: next.blueprint.reference,
    sourceContentIdentity: next.blueprint.contentIdentity,
    versionSet: next.blueprint.versionSet,
    resolvedConfiguration: next.blueprint.content,
    contentIdentity: contentIdentity({ source: next.blueprint.contentIdentity, resolvedConfiguration: next.blueprint.content }),
  };
  for (const profile of next.blueprint.content.targetProfiles) {
    const missing = profile.visibleCapabilities.filter(identity => !available.has(identity));
    if (missing.length) return withLast(next, "Rejected", `Profile ${profile.identity} references missing Capabilities: ${missing.join(", ")}`);
    const targetKey = profile.sandboxId.split(".").at(-1);
    const target = next.targets[targetKey];
    target.activeConfiguration = {
      identity: `active-configuration.${profile.identity}`,
      effectiveBlueprintIdentity: next.effectiveBlueprint.identity,
      effectiveBlueprintContentIdentity: next.effectiveBlueprint.contentIdentity,
      profile,
      contentIdentity: contentIdentity({ effectiveBlueprint: next.effectiveBlueprint.contentIdentity, profile }),
    };
    target.appliedBlueprint = { reference: next.blueprint.reference, contentIdentity: next.blueprint.contentIdentity };
  }
  return withLast(next, "Accepted", "One target-neutral Effective Blueprint prepared two isolated target configurations and both activated atomically per target.");
}

export function executeNext(state, targetKey) {
  const next = clone(state);
  const target = next.targets[targetKey];
  if (!target) return withLast(next, "Rejected", `Unknown target ${targetKey}.`);
  if (!target.appliedBlueprint || !target.activeConfiguration || !next.effectiveBlueprint) return withLast(next, "Rejected", "The target has no Applied Blueprint or active prepared configuration.");
  const scenario = FIXTURE[targetKey];
  const command = scenario.commands[target.stepIndex];
  if (!command) return withLast(next, "NoOp", `${targetKey} scenario is already complete.`);
  const duplicate = target.commandResults.find(result => result.commandIdentity === command.identity);
  if (duplicate) return withLast(next, duplicate.disposition, `Idempotent replay returned ${duplicate.commandIdentity} without new effects.`);
  const handler = handlers[command.action];
  if (!handler) return withLast(next, "Rejected", `No declared Kernel action handler for ${command.action}.`);
  const before = contentIdentity({ records: target.records, events: target.events, movements: target.movements, postingSets: target.postingSets });
  try {
    handler(target, command);
    target.stepIndex += 1;
    target.commandResults.push({ commandIdentity: command.identity, action: command.action, disposition: "Accepted" });
    return withLast(next, "Accepted", `${targetKey}: ${command.action} committed as one governed step.`);
  } catch (error) {
    const after = contentIdentity({ records: target.records, events: target.events, movements: target.movements, postingSets: target.postingSets });
    if (before !== after) throw new Error(`Prototype atomicity failure for rejected ${command.action}.`);
    target.commandResults.push({ commandIdentity: command.identity, action: command.action, disposition: "Rejected", diagnostic: error.message });
    return withLast(next, "Rejected", `${targetKey}: ${error.message}`);
  }
}

export function scenarioProgress(targetKey, target) {
  const commands = FIXTURE[targetKey].commands;
  return { complete: target.stepIndex === commands.length, index: target.stepIndex, total: commands.length, nextAction: commands[target.stepIndex]?.action ?? "complete" };
}

export function invariantReport(state) {
  const targets = {};
  for (const [targetKey, target] of Object.entries(state.targets)) {
    const eventIds = new Set(target.events.map(event => event.identity));
    const postingSetsBalanced = target.postingSets.every(postingSet => {
      const debit = postingSet.entries.filter(entry => entry.side === "debit").reduce((sum, entry) => sum + entry.amount, 0);
      const credit = postingSet.entries.filter(entry => entry.side === "credit").reduce((sum, entry) => sum + entry.amount, 0);
      return debit === credit && debit > 0;
    });
    const causesResolve = [...target.movements, ...target.postingSets].every(effect => eventIds.has(effect.eventId));
    const scopeValid = [...target.records, ...target.events, ...target.movements, ...target.postingSets].every(item =>
      item.tenantId === target.tenantId && item.locationId === target.locationId && item.generationId === target.generationId,
    );
    const itemIds = [...new Set(target.movements.map(movement => movement.itemId))];
    const positions = itemIds.map(itemId => stockPosition(target, itemId));
    const nonnegativeStock = positions.every(position => position.quantity >= 0 && position.value >= 0);
    const balances = ledgerBalances(target);
    const trialBalance = Object.values(balances).reduce((sum, balance) => sum + balance, 0) === 0;
    const progress = scenarioProgress(targetKey, target);
    targets[targetKey] = { postingSetsBalanced, causesResolve, scopeValid, nonnegativeStock, trialBalance, positions, balances, progress, pass: postingSetsBalanced && causesResolve && scopeValid && nonnegativeStock && trialBalance };
  }
  return { targets, pass: Object.values(targets).every(target => target.pass) };
}

export function resetAll(state) {
  const next = clone(state);
  for (const profile of next.blueprint.content.targetProfiles) {
    const targetKey = profile.sandboxId.split(".").at(-1);
    const before = next.targets[targetKey];
    const after = emptyTarget(profile, before.generationNumber + 1);
    next.resetRecords.push({
      identity: `reset.${profile.sandboxId}.${after.generationNumber}`,
      targetId: profile.sandboxId,
      beforeGenerationId: before.generationId,
      afterGenerationId: after.generationId,
      beforeAppliedBlueprint: before.appliedBlueprint,
      result: "Reset",
    });
    next.targets[targetKey] = after;
  }
  return withLast(next, "Accepted", "Retail and cafe now have new clean-unapplied generations; Blueprint governance history remains.");
}

function withLast(state, disposition, message) {
  state.lastResult = { disposition, message };
  return state;
}
