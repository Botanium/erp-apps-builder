import test from "node:test";
import assert from "node:assert/strict";

import { createReferenceSlice } from "../src/reference-slice.mjs";

test("Draft cannot provision and only an explicit exact approval can authorize it", () => {
  const slice = createReferenceSlice();

  const started = slice.dispatch({ type: "interview.start" });
  assert.equal(started.intentBrief.version, 1);
  assert.equal(started.blueprint.versionNumber, 1);
  assert.equal(started.blueprint.lifecycle, "Draft");
  assert.equal(started.blueprint.approvalEligible, false);
  assert.equal(started.blueprint.blockers[0].code, "CFG.TRACEABILITY.ASSUMPTION_ACTIVE");

  const previewed = slice.dispatch({ type: "interview.preview" });
  assert.equal(previewed.blueprint.lifecycle, "Draft");
  assert.equal(previewed.kernel.currentApprovedBlueprint, null);

  const premature = slice.dispatch({ type: "provision.all" });
  assert.equal(premature.lastResult.disposition, "Rejected");
  assert.equal(premature.kernel.targets.retail.appliedBlueprint, null);
  assert.equal(premature.kernel.targets.cafe.appliedBlueprint, null);

  const confirmed = slice.dispatch({ type: "interview.confirm-counter-service" });
  assert.equal(confirmed.intentBrief.version, 2);
  assert.equal(confirmed.blueprint.versionNumber, 2);
  assert.equal(confirmed.blueprint.lifecycle, "Draft");
  assert.equal(confirmed.blueprint.approvalEligible, true);
  assert.notEqual(confirmed.blueprint.reference.versionId, started.blueprint.reference.versionId);

  const authorized = slice.dispatch({ type: "approval.authorize" });
  assert.equal(authorized.lastResult.disposition, "Accepted");
  assert.equal(authorized.blueprint.lifecycle, "Approved");
  assert.deepEqual(authorized.kernel.currentApprovedBlueprint.reference, authorized.blueprint.reference);
  assert.equal(authorized.kernel.currentApprovedBlueprint.contentIdentity, authorized.blueprint.contentIdentity);

  const approvalResults = authorized.kernel.commandResults.filter(result => result.action === "blueprint.approve");
  assert.equal(approvalResults.length, 1);
});
