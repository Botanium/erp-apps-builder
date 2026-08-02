# Reference Vertical Slice TDD Log

This log preserves the red-green evidence for the public seams accepted in
Wayfinder Ticket 14. Times are omitted because the immutable Git history and
test output are the durable ordering evidence.

## Tracer 1: Blueprint authority

- Red: `npm test -- --test-name-pattern='Draft cannot provision'` failed with
  `ERR_MODULE_NOT_FOUND` because `ReferenceSlice.dispatch` did not exist.
- Red after initial implementation: the same test failed at the Kernel command
  boundary because the command Content Identity could not be recomputed.
- Green: the test now proves that interview completion and preview do not
  approve or provision; an Assumption blocks eligibility; confirmation creates
  a new immutable Draft; and only an exact Human Gate decision plus accepted
  Kernel Command creates Blueprint Approval.

## Tracer 2: Shared compilation and independent activation

- Red: `npm test -- --test-name-pattern='compiles once'` failed because no
  Provisioning Attempt collection or Effective Blueprint existed.
- Green: one target-neutral Effective Blueprint is compiled once from the exact
  Approved Blueprint, while two target-specific compatibility verdicts and
  atomic Provisioning Attempts apply it independently to retail and cafe.
- Accumulated suite: 2 tests passed.

## Tracer 3: Retail Golden Transaction

- Red: `npm test -- --test-name-pattern='retail Golden'` failed because the
  retail scenario action did not exist.
- Intermediate red: the first implementation reported USD 166.00 of posting
  turnover instead of the contract's USD 98.00 ending trial-balance totals.
- Green: purchase, receipt, stock admission, accepted Order, fulfilled Sale,
  cash Payment, immutable Stock Movements, balanced Posting Sets, and derived
  balances now reach the exact retail literals without using implementation
  arithmetic to construct expected test values.
- Accumulated suite: 3 tests passed.

## Tracer 4: Cafe order-to-kitchen reuse

- Red: `npm test -- --test-name-pattern='cafe kitchen'` failed because the cafe
  scenario action did not exist.
- Green: the ordinary shared Purchasing and Receiving actions admit beans and
  milk; the Kitchen Ticket advances accepted, preparing, ready, and fulfilled;
  the first three states create no ingredient or financial effect; fulfillment
  consumes exactly 27 g beans and 120 ml milk and posts USD 1.74 cost; the cash
  Payment closes the USD 9.00 receivable.
- Accumulated suite: 4 tests passed.

## Tracer 5: Fail-closed command matrix

- Red: the focused matrix first failed at module load because independently
  recomputable Blueprint Content Identity was not exposed.
- Intermediate red: a mutated Capability object leaked between fixture clones,
  proving that fixture construction was not isolated. Blueprint construction
  now copies every Capability selection.
- Green: schema and version rejection, stale approval and changed Human Gate
  subjects, exact replay, idempotency conflict, Tenant/target/Location/
  generation/Applied-Blueprint/Role boundaries, negative stock, ingredient
  over-consumption, unit and currency mismatch, unbalanced or direct mutation
  attempts, and partial/excess Payment behavior all preserve the declared
  effects boundary.
- Accumulated suite: 8 tests passed.

## Tracer 6: Reset and deterministic replay

- Red: `npm test -- --test-name-pattern='generation replacement'` failed
  because the explicitly authorized reset action did not exist.
- Green: each target now uses a separate exact Reset Authorization, Human Gate,
  idempotent Kernel Command, and atomic generation replacement. Governance
  history survives, stale reset baselines fail without effect, reprovisioning
  reuses the same compiled artifact, retail and cafe business results replay
  identically, and a second reset leaves generations 3 clean and unapplied.
- Accumulated suite: 9 tests passed.
