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

## Tracer 7: One-command evidence and completion

- Red: the focused test failed at module load because
  `AcceptanceEvaluator.evaluate` and the CLI did not exist.
- Intermediate red: the first runner reused the same provisioning command
  identity before and after approval. The Kernel correctly treated the changed
  request as an idempotency conflict, leaving both targets unapplied. Each
  provisioning request now receives a distinct immutable identity.
- Green: `npm run reference-slice` persists real Kernel state through the
  AtomicJsonStore, evaluates twelve Required conditions fail-closed, writes a
  canonical JSON report plus derived owner-readable HTML, independently
  verifies the report Content Identity, observes both final generation-3
  targets clean and unapplied, and exits zero only for `Passed`.
- Budget evidence: the complete proof consumes 75 Kernel deliveries. It starts
  from the accepted 48-delivery Balanced Local Slice default and records one
  explicit bounded Budget Gate amendment to 96 before exceeding that ceiling.
- Accumulated suite: 11 tests passed.

## Readiness-audit correction: closed account taxonomy

- Red: Ticket 16's contract audit found that the excess-Payment test and
  implementation created an undeclared seventh `Customer Credit` account,
  conflicting with Ticket 09's closed six-account taxonomy and explicit rule
  that v1 overpayments are rejected.
- Green: partial Payment still leaves its exact receivable residual, an exact
  remaining Payment reaches zero, and an excess Payment now returns
  `ORC.KERNEL.INVARIANT_REJECTED` with no Payment, Posting Set, cash, account,
  or other governed effect.

## Readiness-audit correction: canonical effects and exports

- Red: the audit test found that outbound Stock Movements encoded negative
  quantities, Ledger Entries lacked their own attributable identities and
  scope, gated decisions did not bind an exact proposed Kernel Command, command
  replay material was incomplete, and no explicit Sandbox Export artifact was
  observable.
- Green: every Stock Movement now carries positive quantity and value plus
  source and destination; every Ledger Entry is immutable, identified, scoped,
  and linked through its Posting Set to the causal Business Event; approval and
  reset gates bind exact proposed commands; durable command bindings make exact
  replay observable; and each target exposes a scoped, minimized,
  content-identified Sandbox Export whose causation, stock, ledger, cash,
  Payment, and isolation invariants independently recompute.
- Accumulated suite: 12 tests passed.

## Readiness-audit correction: intent and participant attribution

- Red: the audit found that the fixture's Assumption and Acceptance Condition
  omitted required review fields and every accepted business command used the
  owner as its responsible source despite distinct Buyer, Receiver, Cashier,
  Kitchen Operator, and reset-executor duties.
- Green: both Intent Brief objects now preserve the complete required review
  envelope; accepted effects retain the responsible fictitious participant for
  their exact Role; Buyer and Receiver remain distinct; and each reset's owner
  Human Gate decision is attributable to a source different from its executing
  Kernel Command.
