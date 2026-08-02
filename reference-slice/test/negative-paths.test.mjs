import test from "node:test";
import assert from "node:assert/strict";

import { contentIdentity, deepClone } from "../src/canonical.mjs";
import {
  createBlueprint,
  createIntentBrief,
  makeCommand,
  recomputeBlueprintContentIdentity,
  RETAIL_FIXTURE,
  SENTINEL_TENANT_ID,
} from "../src/fixtures.mjs";
import { createReferenceSlice } from "../src/reference-slice.mjs";

function provisionedSlice() {
  const slice = createReferenceSlice();
  slice.dispatch({ type: "interview.start" });
  slice.dispatch({ type: "interview.confirm-counter-service" });
  slice.dispatch({ type: "approval.authorize" });
  slice.dispatch({ type: "provision.all" });
  return slice;
}

function targetEffects(slice, targetId = "retail") {
  const target = slice.kernel.observe({ type: "target", targetId });
  return {
    records: target.records,
    events: target.events,
    movements: target.movements,
    postingSets: target.postingSets,
    payments: target.payments,
  };
}

function scopedCommand(slice, { identity, action, role, input, targetId = "retail", locationId, generationId }) {
  const target = slice.kernel.observe({ type: "target", targetId });
  return makeCommand({
    identity,
    action,
    role,
    targetId,
    locationId: locationId ?? target.locationId,
    generationId: generationId ?? target.generationId,
    input: { expectedAppliedBlueprint: target.appliedBlueprint, ...input },
  });
}

function changedCommand(command, changes) {
  const { contentIdentity: _old, ...body } = { ...deepClone(command), ...changes };
  return { ...body, contentIdentity: contentIdentity(body) };
}

test("invalid Blueprint configuration and stale approval fail closed", () => {
  const slice = provisionedSlice();
  const intent = createIntentBrief(3, "Confirmed");

  const unknown = createBlueprint(3, intent, "Confirmed");
  unknown.content.unexpected = true;
  unknown.contentIdentity = recomputeBlueprintContentIdentity(unknown);
  const unknownResult = slice.kernel.submit(makeCommand({
    identity: "command.blueprint.create.unknown",
    action: "blueprint.create-draft",
    input: { blueprint: unknown },
  }));
  assert.equal(unknownResult.disposition, "Rejected");
  assert.equal(unknownResult.code, "CFG.SCHEMA.UNKNOWN_PROPERTY");

  const unsupported = createBlueprint(4, createIntentBrief(4, "Confirmed"), "Confirmed");
  unsupported.content.capabilitySelections[0].version = "2.0.0";
  unsupported.contentIdentity = recomputeBlueprintContentIdentity(unsupported);
  const unsupportedResult = slice.kernel.submit(makeCommand({
    identity: "command.blueprint.create.unsupported",
    action: "blueprint.create-draft",
    input: { blueprint: unsupported },
  }));
  assert.equal(unsupportedResult.disposition, "Rejected");
  assert.equal(unsupportedResult.code, "CFG.CAPABILITY.VERSION_UNSUPPORTED");

  const candidate = createBlueprint(5, createIntentBrief(5, "Confirmed"), "Confirmed");
  const created = slice.kernel.submit(makeCommand({
    identity: "command.blueprint.create.concurrent",
    action: "blueprint.create-draft",
    input: { blueprint: candidate },
  }));
  assert.equal(created.disposition, "Accepted");
  const gateDecision = {
    identity: "human-gate-decision.stale-baseline",
    response: "Authorize Submission",
    subjectVersionId: candidate.reference.versionId,
    subjectContentIdentity: candidate.contentIdentity,
  };
  const staleApproval = slice.kernel.submit(makeCommand({
    identity: "command.blueprint.approve.stale-baseline",
    action: "blueprint.approve",
    input: {
      reference: candidate.reference,
      contentIdentity: candidate.contentIdentity,
      approvalBaseline: null,
    },
    gateDecision,
  }));
  assert.equal(staleApproval.disposition, "Rejected");
  assert.equal(staleApproval.code, "ORC.BASELINE.KERNEL_BASELINE_CHANGED");
  const after = slice.kernel.observe();
  assert.equal(after.lifecycle[candidate.reference.versionId], "Draft");
  assert.equal(after.currentApprovedBlueprint.reference.versionId, "blueprint-version.cedar-steam.v2");

  const changedSubject = slice.kernel.submit(makeCommand({
    identity: "command.blueprint.approve.changed-subject",
    action: "blueprint.approve",
    input: {
      reference: candidate.reference,
      contentIdentity: candidate.contentIdentity,
      approvalBaseline: {
        reference: after.currentApprovedBlueprint.reference,
        contentIdentity: after.currentApprovedBlueprint.contentIdentity,
      },
    },
    gateDecision: { ...gateDecision, identity: "human-gate-decision.changed-subject", subjectContentIdentity: "sha256:changed" },
  }));
  assert.equal(changedSubject.disposition, "Rejected");
  assert.equal(changedSubject.code, "ORC.KERNEL.AUTHORIZATION_REJECTED");
  assert.equal(slice.kernel.observe().lifecycle[candidate.reference.versionId], "Draft");
});

test("idempotency, Tenant, target, Location, generation, Applied Blueprint, and Role boundaries preserve effects", () => {
  const slice = provisionedSlice();
  slice.dispatch({ type: "scenario.retail" });
  const fixture = RETAIL_FIXTURE;
  const replay = slice.kernel.observe().commandBindings["command.retail.payment.accept.01.g1"].command;
  const beforeReplay = targetEffects(slice);
  const replayResult = slice.kernel.submit(replay);
  assert.equal(replayResult.disposition, "Accepted");
  assert.deepEqual(targetEffects(slice), beforeReplay);
  assert.equal(slice.kernel.observe().commandResults.filter(result => result.commandIdentity === replay.identity).length, 1);

  const conflict = changedCommand(replay, {
    input: { ...replay.input, amountMinor: fixture.paymentMinor + 1 },
  });
  const conflictResult = slice.kernel.submit(conflict);
  assert.equal(conflictResult.disposition, "Rejected");
  assert.equal(conflictResult.code, "IDEMPOTENCY_CONFLICT");
  assert.deepEqual(targetEffects(slice), beforeReplay);

  const matrix = [
    ["cross-tenant", command => changedCommand(command, { tenantId: SENTINEL_TENANT_ID })],
    ["wrong-location", command => changedCommand(command, { locationId: "location.cafe" })],
    ["stale-generation", command => changedCommand(command, { generationId: "generation.retail.0" })],
    ["stale-applied", command => changedCommand(command, { input: { ...command.input, expectedAppliedBlueprint: { ...command.input.expectedAppliedBlueprint, contentIdentity: "sha256:stale" } } })],
    ["wrong-role", command => changedCommand(command, { role: "role.cafe-cashier" })],
  ];
  for (const [name, mutate] of matrix) {
    const isolated = provisionedSlice();
    const base = scopedCommand(isolated, {
      identity: `command.negative.${name}`,
      action: "purchase.confirm",
      role: "role.buyer",
      input: { recordId: `purchase-order.negative.${name}`, supplierId: "party.supplier.retail", currency: "USD", lines: [{ itemId: "catalog.widget", unit: "each", quantity: 1, unitCostMinor: 500 }] },
    });
    const before = targetEffects(isolated);
    const result = isolated.kernel.submit(mutate(base));
    assert.equal(result.disposition, "Rejected", name);
    assert.deepEqual(targetEffects(isolated), before, name);
  }

  const exportText = JSON.stringify(slice.kernel.observe({ type: "target-summary", targetId: "retail" }));
  assert.equal(exportText.includes(SENTINEL_TENANT_ID), false);

  const beforeCafe = targetEffects(slice, "cafe");
  const crossTarget = scopedCommand(slice, {
    identity: "command.negative.cross-target-record",
    action: "kitchen.fulfill",
    role: "role.kitchen-operator",
    targetId: "cafe",
    input: { recordId: "kitchen-ticket.retail.unknown", saleId: "sale.retail.unknown" },
  });
  assert.equal(slice.kernel.submit(crossTarget).disposition, "Rejected");
  assert.deepEqual(targetEffects(slice, "cafe"), beforeCafe);
});

test("stock, currency, unit, posting, and immutable-record violations are atomic", () => {
  const negativeStock = provisionedSlice();
  const order = scopedCommand(negativeStock, {
    identity: "command.negative.order.without-stock",
    action: "order.accept",
    role: "role.retail-cashier",
    input: { recordId: "order.negative.no-stock", customerId: "party.customer.retail", currency: "USD", lines: [{ itemId: "catalog.widget", unit: "each", quantity: 1, unitPriceMinor: 1200 }] },
  });
  assert.equal(negativeStock.kernel.submit(order).disposition, "Accepted");
  const beforeFulfill = targetEffects(negativeStock);
  const rejectedSale = negativeStock.kernel.submit(scopedCommand(negativeStock, {
    identity: "command.negative.sale.without-stock",
    action: "sale.fulfill",
    role: "role.retail-cashier",
    input: { recordId: "sale.negative.no-stock", orderId: "order.negative.no-stock" },
  }));
  assert.equal(rejectedSale.code, "ORC.KERNEL.INVARIANT_REJECTED");
  assert.deepEqual(targetEffects(negativeStock), beforeFulfill);

  const unitMismatch = provisionedSlice();
  const po = scopedCommand(unitMismatch, {
    identity: "command.negative.unit.po",
    action: "purchase.confirm",
    role: "role.buyer",
    input: { recordId: "purchase-order.negative.unit", supplierId: "party.supplier.retail", currency: "USD", lines: [{ itemId: "catalog.widget", unit: "each", quantity: 1, unitCostMinor: 500 }] },
  });
  unitMismatch.kernel.submit(po);
  const beforeReceipt = targetEffects(unitMismatch);
  const rejectedReceipt = unitMismatch.kernel.submit(scopedCommand(unitMismatch, {
    identity: "command.negative.unit.receipt",
    action: "receipt.accept",
    role: "role.receiver",
    input: { recordId: "receipt.negative.unit", purchaseOrderId: "purchase-order.negative.unit", currency: "USD", lines: [{ itemId: "catalog.widget", unit: "g", quantity: 1, unitCostMinor: 500 }] },
  }));
  assert.equal(rejectedReceipt.disposition, "Rejected");
  assert.deepEqual(targetEffects(unitMismatch), beforeReceipt);

  const completed = provisionedSlice();
  completed.dispatch({ type: "scenario.retail" });
  for (const [identity, action, input] of [
    ["command.negative.currency", "payment.accept", { recordId: "payment.negative.currency", saleId: RETAIL_FIXTURE.saleId, amountMinor: 1, currency: "EUR", method: "cash", receiptReference: "receipt.negative.currency" }],
    ["command.negative.unbalanced", "ledger.post-direct", { entries: [{ account: "Cash", side: "debit", amountMinor: 100 }] }],
    ["command.negative.mutate", "record.update-direct", { recordId: RETAIL_FIXTURE.saleId }],
    ["command.negative.delete", "business-event.delete", { recordId: "business-event.command.retail.sale.fulfill.01" }],
  ]) {
    const before = targetEffects(completed);
    const result = completed.kernel.submit(scopedCommand(completed, { identity, action, role: "role.owner", input }));
    assert.equal(result.disposition, "Rejected", action);
    assert.deepEqual(targetEffects(completed), before, action);
  }

  const overConsumption = provisionedSlice();
  overConsumption.dispatch({ type: "scenario.cafe" });
  const cafeTarget = "cafe";
  const kitchenCommands = [
    scopedCommand(overConsumption, { identity: "command.negative.cafe.order", action: "order.accept", role: "role.cafe-cashier", targetId: cafeTarget, input: { recordId: "order.cafe.over-consume", customerId: "party.customer.cafe", currency: "USD", lines: [{ itemId: "menu.cortado", unit: "each", quantity: 1, unitPriceMinor: 900, ingredientRequirements: [{ itemId: "ingredient.beans", unit: "g", quantity: 974 }] }] } }),
    scopedCommand(overConsumption, { identity: "command.negative.cafe.accept", action: "kitchen.accept", role: "role.kitchen-operator", targetId: cafeTarget, input: { recordId: "kitchen-ticket.cafe.over-consume", orderId: "order.cafe.over-consume" } }),
    scopedCommand(overConsumption, { identity: "command.negative.cafe.prepare", action: "kitchen.prepare", role: "role.kitchen-operator", targetId: cafeTarget, input: { recordId: "kitchen-ticket.cafe.over-consume" } }),
    scopedCommand(overConsumption, { identity: "command.negative.cafe.ready", action: "kitchen.ready", role: "role.kitchen-operator", targetId: cafeTarget, input: { recordId: "kitchen-ticket.cafe.over-consume" } }),
  ];
  for (const command of kitchenCommands) assert.equal(overConsumption.kernel.submit(command).disposition, "Accepted");
  const beforeOverConsumption = targetEffects(overConsumption, cafeTarget);
  const rejectedKitchen = overConsumption.kernel.submit(scopedCommand(overConsumption, {
    identity: "command.negative.cafe.fulfill",
    action: "kitchen.fulfill",
    role: "role.kitchen-operator",
    targetId: cafeTarget,
    input: { recordId: "kitchen-ticket.cafe.over-consume", saleId: "sale.cafe.over-consume" },
  }));
  assert.equal(rejectedKitchen.code, "ORC.KERNEL.INVARIANT_REJECTED");
  assert.deepEqual(targetEffects(overConsumption, cafeTarget), beforeOverConsumption);
});

test("partial Payment preserves its residual and excess Payment is rejected without write-off", () => {
  const slice = provisionedSlice();
  slice.dispatch({ type: "scenario.retail" });
  const order = scopedCommand(slice, {
    identity: "command.retail.order.accept.02",
    action: "order.accept",
    role: "role.retail-cashier",
    input: { recordId: "order.retail.02", customerId: "party.customer.retail", currency: "USD", lines: [{ itemId: RETAIL_FIXTURE.itemId, unit: "each", quantity: 1, unitPriceMinor: 1200 }] },
  });
  const sale = scopedCommand(slice, {
    identity: "command.retail.sale.fulfill.02",
    action: "sale.fulfill",
    role: "role.retail-cashier",
    input: { recordId: "sale.retail.02", orderId: "order.retail.02" },
  });
  assert.equal(slice.kernel.submit(order).disposition, "Accepted");
  assert.equal(slice.kernel.submit(sale).disposition, "Accepted");

  const partial = slice.kernel.submit(scopedCommand(slice, {
    identity: "command.retail.payment.partial.02",
    action: "payment.accept",
    role: "role.retail-cashier",
    input: { recordId: "payment.retail.partial.02", saleId: "sale.retail.02", amountMinor: 400, currency: "USD", method: "cash", receiptReference: "receipt.retail.partial.02" },
  }));
  assert.equal(partial.output.payment.residualMinor, 800);
  assert.equal(partial.output.payment.unallocatedMinor, 0);

  const exactRemainder = slice.kernel.submit(scopedCommand(slice, {
    identity: "command.retail.payment.remainder.02",
    action: "payment.accept",
    role: "role.retail-cashier",
    input: { recordId: "payment.retail.remainder.02", saleId: "sale.retail.02", amountMinor: 800, currency: "USD", method: "cash", receiptReference: "receipt.retail.remainder.02" },
  }));
  assert.equal(exactRemainder.output.payment.residualMinor, 0);

  const order3 = scopedCommand(slice, {
    identity: "command.retail.order.accept.03",
    action: "order.accept",
    role: "role.retail-cashier",
    input: { recordId: "order.retail.03", customerId: "party.customer.retail", currency: "USD", lines: [{ itemId: RETAIL_FIXTURE.itemId, unit: "each", quantity: 1, unitPriceMinor: 1200 }] },
  });
  const sale3 = scopedCommand(slice, {
    identity: "command.retail.sale.fulfill.03",
    action: "sale.fulfill",
    role: "role.retail-cashier",
    input: { recordId: "sale.retail.03", orderId: "order.retail.03" },
  });
  slice.kernel.submit(order3);
  slice.kernel.submit(sale3);
  const beforeExcess = targetEffects(slice);
  const excess = slice.kernel.submit(scopedCommand(slice, {
    identity: "command.retail.payment.excess.03",
    action: "payment.accept",
    role: "role.retail-cashier",
    input: { recordId: "payment.retail.excess.03", saleId: "sale.retail.03", amountMinor: 1300, currency: "USD", method: "cash", receiptReference: "receipt.retail.excess.03" },
  }));
  assert.equal(excess.disposition, "Rejected");
  assert.equal(excess.code, "ORC.KERNEL.INVARIANT_REJECTED");
  assert.deepEqual(targetEffects(slice), beforeExcess);
  assert.equal(Object.hasOwn(slice.kernel.observe({ type: "target-summary", targetId: "retail" }).accounts, "Customer Credit"), false);
});
