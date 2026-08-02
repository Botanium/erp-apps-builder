import test from "node:test";
import assert from "node:assert/strict";

import { contentIdentity } from "../src/canonical.mjs";
import { SENTINEL_TENANT_ID, TENANT_ID } from "../src/fixtures.mjs";
import { createReferenceSlice } from "../src/reference-slice.mjs";

test("canonical stock, ledger, gate, replay, and Sandbox Export contracts are observable", () => {
  const slice = createReferenceSlice();
  slice.dispatch({ type: "interview.start" });
  const confirmed = slice.dispatch({ type: "interview.confirm-counter-service" });
  const catalog = confirmed.blueprint.content.capabilitySelections.find(capability => capability.identity === "capability.catalog");
  assert.deepEqual(catalog.settings.menuItems[0], {
    identity: "menu.cortado",
    basePriceMinor: 800,
    currency: "USD",
    ingredientRequirements: [
      { itemId: "ingredient.beans", quantity: 18, unit: "g" },
      { itemId: "ingredient.milk", quantity: 120, unit: "ml" },
    ],
  });
  assert.deepEqual(catalog.settings.modifiers[0], {
    identity: "modifier.extra-shot",
    priceMinor: 100,
    currency: "USD",
    ingredientRequirements: [{ itemId: "ingredient.beans", quantity: 9, unit: "g" }],
  });

  const approved = slice.dispatch({ type: "approval.authorize" });
  const approvalGate = approved.humanGates[0];
  const approvalDecision = approved.humanGateDecisions[0];
  assert.equal(approvalGate.subjectCommandIdentity, "command.blueprint.approve.v2");
  assert.match(approvalGate.subjectCommandContentIdentity, /^sha256:/);
  assert.equal(approvalDecision.subjectCommandIdentity, approvalGate.subjectCommandIdentity);
  assert.equal(approvalDecision.subjectCommandContentIdentity, approvalGate.subjectCommandContentIdentity);
  assert.match(approvalGate.nonEffect, /does not create Blueprint Approval/i);

  slice.dispatch({ type: "provision.all" });
  slice.dispatch({ type: "scenario.retail" });
  slice.dispatch({ type: "scenario.cafe" });
  const snapshot = slice.kernel.observe();

  for (const target of Object.values(snapshot.targets)) {
    assert.ok(target.movements.every(movement => Number.isInteger(movement.quantity) && movement.quantity > 0));
    assert.ok(target.movements.every(movement => Number.isInteger(movement.valueMinor) && movement.valueMinor > 0));
    assert.ok(target.movements.every(movement => !("signedQuantity" in movement) && !("signedValueMinor" in movement)));
    for (const postingSet of target.postingSets) {
      assert.ok(postingSet.entries.every(entry => entry.identity && entry.type === "Ledger Entry"));
      assert.ok(postingSet.entries.every(entry => entry.tenantId === TENANT_ID && entry.targetId === target.targetId && entry.locationId === target.locationId && entry.generationId === target.generationId));
      assert.ok(postingSet.entries.every(entry => entry.businessEventId === postingSet.businessEventId && entry.currency === postingSet.currency));
    }
    const summary = slice.kernel.observe({ type: "target-summary", targetId: target.targetId });
    assert.ok(Object.values(summary.invariants).every(Boolean));
  }

  const beforeReplay = contentIdentity({ approvals: snapshot.approvals, targets: snapshot.targets });
  for (const identity of [
    "command.blueprint.approve.v2",
    "command.retail.receipt.accept.01.g1",
    "command.retail.sale.fulfill.01.g1",
    "command.retail.payment.accept.01.g1",
    "command.cafe.kitchen.fulfill.01.g1",
  ]) {
    const binding = snapshot.commandBindings[identity];
    assert.ok(binding.command, identity);
    assert.deepEqual(slice.kernel.submit(binding.command), binding.result);
  }
  assert.equal(contentIdentity({ approvals: slice.kernel.observe().approvals, targets: slice.kernel.observe().targets }), beforeReplay);

  for (const target of Object.values(snapshot.targets)) {
    const exported = slice.kernel.observe({
      type: "sandbox-export",
      tenantId: TENANT_ID,
      targetId: target.targetId,
      locationId: target.locationId,
      generationId: target.generationId,
      role: "role.owner",
    });
    const { contentIdentity: recorded, ...body } = exported;
    assert.equal(recorded, contentIdentity(body));
    assert.equal(JSON.stringify(exported).includes(SENTINEL_TENANT_ID), false);
  }
  assert.throws(() => slice.kernel.observe({
    type: "sandbox-export",
    tenantId: SENTINEL_TENANT_ID,
    targetId: "retail",
    locationId: "location.retail",
    generationId: "generation.retail.1",
    role: "role.owner",
  }), /scope mismatch/i);
});

