# Define the Reference Vertical Slice acceptance contract

Type: grilling  
Status: resolved
Blocked by: 09, 10, 11, 12, 13

## Question

Which user-visible scenarios, public seams, fixtures, invariant checks, reset
proof, and owner-review evidence must pass before the Reference Vertical Slice
is accepted?

## Answer

Use one closed, versioned, fail-closed acceptance suite with fixed fictitious
fixtures, literal expected outcomes, and behavior checks only through the four
approved public Interfaces. This is the recommended option accepted under the
owner's standing approval for the remaining Wayfinder tickets.

The suite Machine Identity is `reference-slice.acceptance-suite`, version
`1.0.0`. Its fixture identity is `reference-slice.fixture.cedar-steam`, version
`1.0.0`. Their exact content identities are calculated from canonical content
by the implementation and recorded in every run; no test or runner may accept
`latest`, a range, a label, or an unbound fixture.

## Acceptance authority and verdicts

1. This contract predeclares scenarios and expected evidence. The running
   Agent, Orchestration Run, prototype shell, or test code may not weaken,
   remove, reinterpret, or invent a Required condition.
2. Each condition is observed as Satisfied, Unsatisfied, or Indeterminate under
   the accepted Observation contract. Indeterminate fails closed.
3. The Reference Slice Acceptance Report records `Passed` only when every
   Required condition is currently Satisfied, all evidence and budget reconcile,
   both final target resets pass, and no required effect status is unresolved.
   Any Unsatisfied condition yields `Failed`; any incomplete or non-comparable
   condition yields `Indeterminate`.
4. `Passed` is machine-verifiable prototype evidence. It is not owner sign-off,
   Blueprint Approval, accounting or regulatory compliance, deployment
   permission, or production readiness. The owner's standing instruction
   approves this recommended contract; it does not predeclare that a future run
   passed.
5. Advisory observations remain visible but cannot hide, offset, or downgrade a
   Required failure.

## Fixed proof identities and boundary

The fixture uses:

- primary Tenant `tenant.cedar-steam`, explicitly marked fictitious;
- isolation sentinel Tenant `tenant.isolation-sentinel`, with no Blueprint,
  Applied Blueprint, fixture, or positive business effect;
- retail target `sandbox.retail` at `location.retail`;
- cafe target `sandbox.cafe` at `location.cafe`;
- currency `USD`, represented only as positive integer minor units;
- stock units `each`, `g`, and `ml`, with no conversion;
- deterministic effective and recorded times beginning at
  `2026-01-15T09:00:00.000Z`; and
- deterministic opaque fixture identities whose provenance says
  `fictitious-reference-slice`.

The fixture contains no real customer, employee, payment, banking, identity,
clinical, credential, secret, production, or unknown-origin data. Every named
category carries a Sensitive Data Class; none contains Restricted values.
External AI, network integrations, production authority, and live credentials
are absent.

## Owner Interview and Blueprint fixture

1. The Owner Interview creates Intent Brief version 1 with attributable
   statements covering all eight required fact families. Every statement has
   exactly one Intent State and source, every data category has a Sensitive Data
   Class, and at least one Confirmed Required Acceptance Condition anchors the
   proof.
2. Version 1 deliberately carries `counter service only` as an Assumption with
   its rationale, affected cafe scope, impact if false, reviewer, and resolution
   condition. Draft Blueprint version 1 may be previewed, but Approval
   Eligibility is false and the approval action is unavailable.
3. Preview viewing, navigation, recommended-option display, Evidence workbook
   viewing, and interview completion are each observed not to create Blueprint
   Approval or Applied state.
4. One explicit attributable owner fixture decision confirms counter service
   and the v1 exclusions. It creates Intent Brief version 2 and a new immutable
   Draft Blueprint version 2; it never mutates version 1 or implicitly approves
   version 2.
5. Draft version 2 conforms to all eleven canonical Blueprint sections. It
   selects the union of all eleven v1 Capabilities at exact `1.0.0`, one retail
   target profile exposing its required ten, and one cafe target profile
   exposing its required nine. Shared Capabilities have the same exact identity
   and version in both profiles.
6. The Blueprint configures the six accepted business Roles—Owner, Buyer,
   Receiver, Retail Cashier, Cafe Cashier, and Kitchen Operator—with exact
   Tenant and Location scopes. Buyer and Receiver remain distinct. Purchasing
   and Receiving setup for each Location uses those ordinary governed Roles;
   hiding the controls from cafe navigation does not change authority.
7. The review bundle binds Draft version 2, its recomputed Content Identity,
   current absent Approval Baseline, validation report, target-specific Initial
   Provision Compatible verdicts, Semantic Diff from version 1, complete
   traceability, data-exposure summary, exclusions, and zero blocking
   diagnostics.
8. One explicit Kernel Submission Human Gate names the exact approval Kernel
   Command and its non-effects. One attributable Authorize Submission decision
   allows only that unchanged command.
9. `BusinessKernel.submit` atomically accepts the exact approval command once
   and records Blueprint Approval for Draft version 2. Replaying the identical
   command returns the same result without a second approval. Reusing its
   identity with changed content fails as an Idempotency Conflict.
10. Provisioning uses two separate requests, compatibility verdicts, attempts,
    and atomic target activations. Both targets must record the exact approved
    Blueprint Reference and Content Identity as Applied. One target's success
    cannot satisfy the other target's condition.

## Exact retail Golden Transaction fixture

The retail path uses one item `catalog.widget`, unit `each`:

1. Confirm Purchase Order `purchase-order.retail.01` for 10 units at USD 5.00
   each. Expected effect: the Purchase Order becomes confirmed; stock and ledger
   effects remain zero.
2. Accept Supplier Receipt `supplier-receipt.retail.01` for all 10 units at
   `location.retail`. Expected effect: one Stock Movement from supplier boundary
   to the Location for 10 units and one Posting Set for USD 50.00: debit
   Inventory 5,000; credit Accounts Payable 5,000.
3. Accept Order `order.retail.01` for 4 units at the frozen selling price USD
   12.00 each. Expected effect: commercial intent exists; no stock, revenue,
   receivable, cash, or cost effect occurs yet.
4. Fulfill Sale `sale.retail.01`. Expected effects commit atomically: move 4
   units from `location.retail` to the customer boundary; debit Accounts
   Receivable 4,800 and credit Sales Revenue 4,800; debit Cost of Goods Sold
   2,000 and credit Inventory 2,000.
5. Accept cash Payment `payment.retail.01` for USD 48.00 with independent
   fictitious receipt reference `receipt.retail.01`, allocated fully to the
   Sale. Expected posting: debit Cash 4,800; credit Accounts Receivable 4,800;
   reconciliation residual zero.

Required final retail literals before reset are:

| Result | Expected |
|---|---:|
| Widget on hand | 6 each |
| Inventory value | USD 30.00 |
| Cash | USD 48.00 debit |
| Accounts Receivable | USD 0.00 |
| Cost of Goods Sold | USD 20.00 debit |
| Accounts Payable | USD 50.00 credit |
| Sales Revenue | USD 48.00 credit |
| Trial-balance debits | USD 98.00 |
| Trial-balance credits | USD 98.00 |

Expected literals are fixed independently in this contract; tests may not
calculate their expected values by calling the production arithmetic.

## Exact cafe order-to-kitchen fixture

The Blueprint configures Menu Item `menu.cortado` with base price USD 8.00 and
frozen base ingredients 18 g `ingredient.beans` plus 120 ml
`ingredient.milk`. Modifier `modifier.extra-shot` adds USD 1.00 and 9 g beans.
The accepted Order therefore freezes price USD 9.00 and ingredient requirements
of 27 g beans plus 120 ml milk.

Fictitious setup uses the shared ordinary Purchasing and Receiving governed
actions before the owner-facing cafe flow:

1. Confirm Purchase Order `purchase-order.cafe.01` for 1,000 g beans at USD
   0.02 per g and 2,000 ml milk at USD 0.01 per ml.
2. Accept Supplier Receipt `supplier-receipt.cafe.01` at `location.cafe`.
   Expected stock is 1,000 g beans valued USD 20.00 plus 2,000 ml milk valued
   USD 20.00; the one receipt Posting Set debits Inventory 4,000 and credits
   Accounts Payable 4,000.

The required cafe flow then:

3. Accept Order `order.cafe.01` for one Cortado with Extra Shot.
4. Create Kitchen Ticket `kitchen-ticket.cafe.01` in `accepted`.
5. Transition the ticket to `preparing`.
6. Transition the ticket to `ready`.
7. Transition the ticket once to `fulfilled`.
8. Accept cash Payment `payment.cafe.01` for USD 9.00 with independent
   fictitious receipt reference `receipt.cafe.01`, allocated fully to the Sale.

Accepted, preparing, and ready create no Ingredient Consumption, revenue, cost,
receivable, or cash effect. The first valid fulfilled transition atomically:

- moves 27 g beans and 120 ml milk from `location.cafe` to the consumption
  boundary;
- debits Accounts Receivable 900 and credits Sales Revenue 900;
- debits Cost of Goods Sold 174 and credits Inventory 174; and
- links every effect to the same causal fulfillment Business Event while
  preserving distinct Posting Sets where the financial contract requires.

Required final cafe literals before reset are:

| Result | Expected |
|---|---:|
| Beans on hand | 973 g |
| Beans value | USD 19.46 |
| Milk on hand | 1,880 ml |
| Milk value | USD 18.80 |
| Total Inventory value | USD 38.26 |
| Ingredient cost consumed | USD 1.74 |
| Cash | USD 9.00 debit |
| Accounts Receivable | USD 0.00 |
| Accounts Payable | USD 40.00 credit |
| Sales Revenue | USD 9.00 credit |
| Trial-balance debits | USD 49.00 |
| Trial-balance credits | USD 49.00 |

## Required negative-path matrix

Negative checks use exact public Interfaces against isolated fixture clones so
they cannot contaminate the accepted retail or cafe paths. Every rejected
command must prove zero unintended effects by observing before and after state;
the declared partial-Payment check may create only its exact accepted Payment,
posting, allocation, and positive residual:

1. Draft or merely previewed Blueprint cannot compile for provisioning, become
   Applied, or execute a governed business action.
2. Unknown Blueprint property yields
   `CFG.SCHEMA.UNKNOWN_PROPERTY`; unsupported Capability version yields
   `CFG.CAPABILITY.VERSION_UNSUPPORTED`; neither candidate becomes eligible.
3. An active Assumption yields `CFG.TRACEABILITY.ASSUMPTION_ACTIVE` and cannot be
   acknowledged into approval.
4. A stale Approval Baseline or changed approval subject leaves the Draft in
   Draft and produces the corresponding Control Baseline Conflict.
5. Exact Kernel Command replay returns the recorded result and creates no
   duplicate Approval, receipt, fulfillment, Ingredient Consumption, Payment,
   Stock Movement, Posting Set, or Business Event.
6. Reusing a Kernel Command Identity with changed content produces an
   Idempotency Conflict and no effect.
7. Cross-Tenant, cross-target, cross-Location, stale-generation,
   stale-Applied-Blueprint, and out-of-scope Role commands are rejected without
   leaking the sentinel or other target's data.
8. An attempted unbalanced Posting Set, currency mismatch, normalized-unit
   mismatch, negative-stock retail Sale, or over-consumption is rejected
   atomically. Orchestration records the relevant `ORC.KERNEL` classification.
9. Kitchen accepted, preparing, and ready leave ingredient, revenue,
   receivable, cost, and cash effects unchanged. Repeated fulfilled uses the
   original command result and creates no duplicate effect.
10. A permitted partial Payment is accepted with an explicit positive
    receivable residual. An excess Payment is rejected atomically because v1
    has no unapplied-funds account, customer-credit account, or invented
    write-off. The accepted exact full Payment reaches zero residual.
11. A direct update or deletion of a Ledger Entry, Posting Set, Stock Movement,
    Business Event, accepted Payment, or fulfilled Record is unavailable
    through the public command vocabulary and rejected if attempted.
12. Reset with a stale target, generation, Applied Blueprint, scope, or expired
    authorization changes nothing.

## Isolation, audit, and invariant checks

After every accepted or rejected Kernel Command, `BusinessKernel.observe` must
independently establish:

- one durable command result for the exact command identity and content;
- every Record and effect has the expected Tenant, target, Location, generation,
  Applied Blueprint, responsible source, effective and recorded time, and
  causation;
- every effect-declaring Business Event links to all and only its resulting
  immutable effects;
- every Posting Set has positive entries in one currency and equal debit and
  credit totals;
- the trial balance is zero-sum and independently derived from Ledger Entries;
- every Stock Position quantity equals signed Stock Movements and value equals
  moving-weighted-average unconsumed value;
- Inventory ledger control balance equals total target stock valuation;
- cash equals accepted cash Payments and linked Posting Sets;
- every Payment allocation and residual recomputes exactly;
- neither target read, report, invariant, or Sandbox Export contains the other
  target's generation state; and
- the sentinel Tenant remains empty and undisclosed.

Tampered derived values or stored projections must be ignored and detected by
recomputation. The invariant report fails rather than repairing state.

## Reset and deterministic replay proof

1. After both first-run scenarios pass, two explicit fresh Reset Authorizations
   bind the exact target, generation, Applied Blueprint, deletion scope, final
   clean-unapplied state, and idempotency identity.
2. Each reset atomically activates a new generation with explicit absence of an
   Applied Blueprint and zero active Records, Business Events, runtime Evidence,
   Stock Movements, Posting Sets, Ledger Entries, Payments, stock, cash,
   balances, assignments, and pending attempts. The replaced generation is no
   longer accessible through active reads.
3. Intent Briefs, all Blueprint Versions and identities, review and approval
   records, validation and compatibility artifacts, Provisioning Attempts,
   command results needed for governance, and Reset records remain queryable.
4. The same exact Approved Blueprint is reprovisioned to the new generations,
   and the exact fixture runs a second time. All business-state, stock, ledger,
   payment, Workflow, and invariant literals above must match the first run;
   only occurrence identities and declared times may differ.
5. A second authorized reset leaves both targets in final new clean-unapplied
   generations. The one-command runner exits only after that final state is
   observed. Partial reset or replay failure never counts as whole-slice pass.

## Public-seam acceptance matrix

| Public Interface | Required behaviors |
|---|---|
| `ReferenceSlice.dispatch` | Interview coverage, attributable intent update, Assumption visibility and resolution, exact Human Gates, Orchestration state/budget/failure/observation progression, one-command sequence, tailored retail/cafe views |
| `BusinessKernel.submit` | Exact approval, validation failure, provisioning, all retail and cafe actions, authorization, Evidence, idempotency, atomic stock and ledger effects, Payment reconciliation, rejection, and reset |
| `BusinessKernel.observe` | Exact lifecycle and Applied state, Records and Workflows, causation, immutable effects, stock/cash/ledger projections, target isolation, governance history, Sandbox Export, and clean generations |
| `AcceptanceEvaluator.evaluate` | Condition freshness, Required versus Advisory aggregation, literal fixture results, known effect status, budget reconciliation, replay equality, final reset, and deterministic Passed/Failed/Indeterminate result |

These are the pre-agreed TDD seams. Ticket 15 may add private helpers but may
not introduce a new public seam or test through internal Modules without a new
owner-attributable architecture decision.

## TDD tracer order

Ticket 15 must proceed one observable behavior at a time:

1. Draft cannot provision; exact explicit Blueprint Approval can.
2. One Approved Blueprint compiles once and applies independently to two clean
   targets.
3. Retail Golden Transaction reaches its literal stock, cash, and ledger state.
4. Cafe Kitchen Ticket reaches each state and only fulfillment consumes the
   literal ingredients and posts the literal financial effects.
5. Idempotency, stale baselines, authorization, isolation, stock, ledger, unit,
   currency, and Payment negative paths fail with zero unintended effect.
6. First reset, deterministic reprovision and replay, and final reset reach the
   exact clean boundary.
7. The one-command runner and AcceptanceEvaluator create the complete evidence
   bundle and correct exit status.

For each tracer: write one failing behavior test at the named public Interface,
run it and observe the expected failure, implement only enough to pass, rerun
the focused test, then run the accumulated suite. Mocks are permitted only for
true boundaries—deterministic clock, identity source, and the MemoryStore
Adapter. Internal Kernel collaborators are never mocked.

## Reference Slice Acceptance Report

`npm run reference-slice` must atomically write a canonical JSON report and a
derived static HTML review under the exact local evidence directory declared by
the runner. The report binds:

- source revision and source-file Content Identity;
- Node runtime, platform, suite, fixture, Kernel, schema, validator, compiler,
  Capability, policy, and Adapter Version Sets;
- exact Orchestration Run, Agent Run attempts if any, Run Budget, Human Gates,
  Failure Records, Kernel Commands and Results, observations, and Run
  Completion Record;
- both Intent Brief versions, both Draft Blueprint versions, review bundle,
  exact Blueprint Approval, Effective Blueprint, compatibility and provisioning
  artifacts, and Applied state history;
- every Required and Advisory condition with its durable source and verdict;
- first-run and replay retail/cafe business results, negative-path results,
  invariant reports, Sandbox Exports, and semantic comparison;
- both reset rounds and final clean-unapplied target observations;
- all prototype limits and out-of-scope boundaries; and
- one deterministic report Content Identity independently recomputed before
  `Passed` is recorded.

The static HTML must make the exact identities, Blueprint review, tailored
retail and cafe paths, state transitions, invariant totals, rejections, reset,
and exclusions owner-readable. It is a derived Presenter artifact; JSON remains
the canonical acceptance evidence. Neither artifact contains secrets,
Restricted values, raw agent reasoning, or production claims.

The runner returns exit code `0` only for a complete `Passed` report and a
verified final clean state. `Failed`, `Indeterminate`, write failure, digest
mismatch, unreconciled budget, stale evidence, or partial target result returns
nonzero while preserving safe diagnostics and any valid prior evidence.
