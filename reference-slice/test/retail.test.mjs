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

test("retail Golden Transaction reaches the fixed stock, cash, and ledger literals", () => {
  const slice = provisionedSlice();
  const completed = slice.dispatch({ type: "scenario.retail" });
  const retail = completed.business.retail;

  assert.deepEqual(retail.stock["catalog.widget"], {
    quantity: 6,
    unit: "each",
    valueMinor: 3000,
  });
  assert.equal(retail.accounts.Inventory, 3000);
  assert.equal(retail.accounts.Cash, 4800);
  assert.equal(retail.accounts["Accounts Receivable"], 0);
  assert.equal(retail.accounts["Cost of Goods Sold"], 2000);
  assert.equal(retail.accounts["Accounts Payable"], -5000);
  assert.equal(retail.accounts["Sales Revenue"], -4800);
  assert.deepEqual(retail.trialBalance, {
    debitsMinor: 9800,
    creditsMinor: 9800,
    differenceMinor: 0,
  });
  assert.equal(retail.payments[0].residualMinor, 0);
  assert.equal(retail.invariants.balancedPostingSets, true);
  assert.equal(retail.invariants.stockMatchesMovements, true);
  assert.equal(retail.invariants.inventoryControlMatchesStock, true);
  assert.equal(retail.invariants.cashMatchesPayments, true);

  const actions = completed.kernel.commandResults
    .filter(result => result.disposition === "Accepted")
    .map(result => result.action);
  assert.deepEqual(actions.slice(-5), [
    "purchase.confirm",
    "receipt.accept",
    "order.accept",
    "sale.fulfill",
    "payment.accept",
  ]);
});

