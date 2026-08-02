import test from "node:test";
import assert from "node:assert/strict";

import { contentIdentity, deepClone } from "../src/canonical.mjs";
import { createReferenceSlice } from "../src/reference-slice.mjs";

function readySlice() {
  const slice = createReferenceSlice();
  slice.dispatch({ type: "interview.start" });
  slice.dispatch({ type: "interview.confirm-counter-service" });
  slice.dispatch({ type: "approval.authorize" });
  slice.dispatch({ type: "provision.all" });
  return slice;
}

function expectedBusiness(summary) {
  return {
    stock: summary.stock,
    accounts: summary.accounts,
    trialBalance: summary.trialBalance,
    paymentResiduals: summary.payments.map(payment => ({ residualMinor: payment.residualMinor, unallocatedMinor: payment.unallocatedMinor })),
    records: summary.records.map(record => ({ identity: record.identity, type: record.type, state: record.state, stateHistory: record.stateHistory ?? null })),
    invariants: summary.invariants,
  };
}

function assertClean(target, expectedGeneration) {
  assert.equal(target.generationNumber, expectedGeneration);
  assert.equal(target.appliedBlueprint, null);
  for (const collection of ["records", "events", "movements", "postingSets", "payments"]) assert.equal(target[collection].length, 0, collection);
}

test("authorized generation replacement resets, replays deterministically, and finishes clean", () => {
  const slice = readySlice();
  slice.dispatch({ type: "scenario.retail" });
  slice.dispatch({ type: "scenario.cafe" });
  const first = slice.view().business;

  const resetOne = slice.dispatch({ type: "reset.all" });
  assert.equal(resetOne.lastResult.disposition, "Reset");
  assertClean(resetOne.kernel.targets.retail, 2);
  assertClean(resetOne.kernel.targets.cafe, 2);
  assert.equal(resetOne.kernel.resetRecords.length, 2);
  assert.equal(resetOne.kernel.approvals.length, 1);
  assert.equal(Object.keys(resetOne.kernel.blueprints).length, 2);

  const resetCommand = resetOne.lastResult.commands[0];
  const resetHistoryLength = resetOne.kernel.resetRecords.length;
  const duplicate = slice.kernel.submit(resetCommand);
  assert.equal(duplicate.disposition, "Accepted");
  assert.equal(slice.kernel.observe().resetRecords.length, resetHistoryLength);
  assert.equal(slice.kernel.observe({ type: "target", targetId: "retail" }).generationNumber, 2);

  const { contentIdentity: _identity, ...staleBody } = deepClone(resetCommand);
  staleBody.identity = "command.reset.retail.stale-generation";
  const stale = { ...staleBody, contentIdentity: contentIdentity(staleBody) };
  const beforeStale = slice.kernel.observe({ type: "target", targetId: "retail" });
  assert.equal(slice.kernel.submit(stale).disposition, "Rejected");
  assert.deepEqual(slice.kernel.observe({ type: "target", targetId: "retail" }), beforeStale);

  const reprovisioned = slice.dispatch({ type: "provision.all" });
  assert.equal(reprovisioned.lastResult.disposition, "Applied");
  slice.dispatch({ type: "scenario.retail" });
  slice.dispatch({ type: "scenario.cafe" });
  const replay = slice.view().business;
  assert.deepEqual(expectedBusiness(replay.retail), expectedBusiness(first.retail));
  assert.deepEqual(expectedBusiness(replay.cafe), expectedBusiness(first.cafe));

  const resetTwo = slice.dispatch({ type: "reset.all" });
  assert.equal(resetTwo.lastResult.disposition, "Reset");
  assertClean(resetTwo.kernel.targets.retail, 3);
  assertClean(resetTwo.kernel.targets.cafe, 3);
  assert.equal(resetTwo.kernel.resetRecords.length, 4);
  assert.equal(resetTwo.kernel.approvals.length, 1);
  assert.equal(resetTwo.kernel.compilationRecords.length, 1);
});

