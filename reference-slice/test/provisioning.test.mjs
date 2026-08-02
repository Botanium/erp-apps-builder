import test from "node:test";
import assert from "node:assert/strict";

import { createReferenceSlice } from "../src/reference-slice.mjs";

test("one Approved Blueprint compiles once and applies independently to both clean targets", () => {
  const slice = createReferenceSlice();
  slice.dispatch({ type: "interview.start" });
  slice.dispatch({ type: "interview.confirm-counter-service" });
  const approved = slice.dispatch({ type: "approval.authorize" });

  assert.equal(approved.kernel.effectiveBlueprint, null);
  assert.equal(approved.kernel.provisioningAttempts.length, 0);

  const provisioned = slice.dispatch({ type: "provision.all" });

  assert.equal(provisioned.lastResult.disposition, "Applied");
  assert.equal(provisioned.kernel.compilationRecords.length, 1);
  assert.equal(provisioned.kernel.provisioningAttempts.length, 2);
  assert.deepEqual(
    provisioned.kernel.targets.retail.appliedBlueprint,
    provisioned.kernel.currentApprovedBlueprint,
  );
  assert.deepEqual(
    provisioned.kernel.targets.cafe.appliedBlueprint,
    provisioned.kernel.currentApprovedBlueprint,
  );

  const retail = provisioned.kernel.targets.retail.activeConfiguration;
  const cafe = provisioned.kernel.targets.cafe.activeConfiguration;
  assert.equal(retail.targetId, "retail");
  assert.equal(cafe.targetId, "cafe");
  assert.notDeepEqual(retail.visibleCapabilities, cafe.visibleCapabilities);

  const shared = [
    "capability.party-registry",
    "capability.catalog",
    "capability.inventory",
    "capability.ordering",
    "capability.sales",
    "capability.payment",
    "capability.cash",
    "capability.ledger",
  ];
  for (const identity of shared) {
    assert.deepEqual(
      retail.capabilities.find(capability => capability.identity === identity),
      cafe.capabilities.find(capability => capability.identity === identity),
    );
  }
});

