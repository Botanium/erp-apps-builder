import test from "node:test";
import assert from "node:assert/strict";

import { createReferenceSlice } from "../src/reference-slice.mjs";

function provisionedSlice() {
  const slice = createReferenceSlice();
  slice.dispatch({ type: "interview.start" });
  slice.dispatch({ type: "interview.confirm-counter-service" });
  slice.dispatch({ type: "approval.authorize" });
  slice.dispatch({ type: "provision.all" });
  return slice;
}

test("cafe kitchen progression consumes ingredients and posts only at fulfillment", () => {
  const slice = provisionedSlice();
  const completed = slice.dispatch({ type: "scenario.cafe" });
  const cafe = completed.business.cafe;
  const { checkpoints } = completed.lastResult;

  for (const state of ["accepted", "preparing", "ready"]) {
    assert.deepEqual(checkpoints[state].stock, {
      "ingredient.beans": { quantity: 1000, unit: "g", valueMinor: 2000 },
      "ingredient.milk": { quantity: 2000, unit: "ml", valueMinor: 2000 },
    });
    assert.equal(checkpoints[state].accounts.Inventory, 4000);
    assert.equal(checkpoints[state].accounts["Sales Revenue"], 0);
    assert.equal(checkpoints[state].accounts["Cost of Goods Sold"], 0);
    assert.equal(checkpoints[state].movements.length, 2);
  }

  assert.deepEqual(cafe.stock["ingredient.beans"], {
    quantity: 973,
    unit: "g",
    valueMinor: 1946,
  });
  assert.deepEqual(cafe.stock["ingredient.milk"], {
    quantity: 1880,
    unit: "ml",
    valueMinor: 1880,
  });
  assert.equal(cafe.accounts.Inventory, 3826);
  assert.equal(cafe.accounts.Cash, 900);
  assert.equal(cafe.accounts["Accounts Receivable"], 0);
  assert.equal(cafe.accounts["Cost of Goods Sold"], 174);
  assert.equal(cafe.accounts["Accounts Payable"], -4000);
  assert.equal(cafe.accounts["Sales Revenue"], -900);
  assert.deepEqual(cafe.trialBalance, {
    debitsMinor: 4900,
    creditsMinor: 4900,
    differenceMinor: 0,
  });
  assert.equal(cafe.payments[0].residualMinor, 0);

  const ticket = cafe.records.find(record => record.identity === "kitchen-ticket.cafe.01");
  assert.equal(ticket.state, "fulfilled");
  assert.deepEqual(ticket.stateHistory, ["accepted", "preparing", "ready", "fulfilled"]);
  assert.equal(cafe.invariants.balancedPostingSets, true);
  assert.equal(cafe.invariants.inventoryControlMatchesStock, true);
  assert.equal(cafe.invariants.cashMatchesPayments, true);
});

