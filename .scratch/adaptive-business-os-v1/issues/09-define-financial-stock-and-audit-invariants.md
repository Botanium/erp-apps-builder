# Define financial, stock, and audit invariants

Type: grilling  
Status: resolved
Blocked by: 01, 04, 07

## Question

Which exact invariants and reversal rules must the Business Kernel enforce for
authorization, purchasing, receipt, stock, sale, payment, ledger balance,
Ingredient Consumption, audit evidence, and reset?

## Answer

### Accepted decisions

#### Owner-approved recommendation method

On 2026-08-02, Botan explicitly authorized the recommended option for each
remaining decision in this ticket until the ticket was complete. The following
contracts are therefore the accepted v1 decisions, not unconfirmed Agent
choices. They govern only the local fictitious Reference Vertical Slice and do
not claim tax, accounting-standard, audit, jurisdictional, or production
compliance.

Both retail and cafe must pin the same exact
`kernel.policy.financial-stock-audit` version `1.0.0`. A Business Blueprint may
select this declared Policy Profile but may not change its posting map, stock
arithmetic, authorization enforcement, invariant rules, or Reversal semantics.

#### Common authority, authorization, and atomicity contract

Use one deterministic, fail-closed Business Kernel commit boundary for every
governed business occurrence.

1. Every governed action must arrive as one typed Kernel Command with the exact
   Tenant, Location, active Sandbox generation, Applied Blueprint, expected
   prior state, responsible source, Role, Evidence, policy version, and
   idempotency identity required by the declared action.
2. Authorization is denied by default. The Business Kernel must prove the
   participant's assigned Role, permitted governed action, Tenant and Location
   scope, Record and Workflow scope, required Evidence, expected baseline, and
   every mandatory separation-of-duty rule before accepting the command.
3. Purchasing, Receiving, Sales, Payment, Cash, Kitchen Operations, financial
   review, Reversal, and Sandbox Reset remain distinct Role responsibilities.
   One participant may hold multiple ordinary responsibilities only where the
   Approved Blueprint explicitly allows it; presentation, AI output, or an
   interface control never grants authority.
4. A participant responsible for an original stock or accounting effect may
   not be the sole reviewer authorizing its Reversal. Reset Authorization and
   reset execution must also have distinct attributable decision and execution
   sources. These minimum separations cannot be weakened by configuration.
5. For an accepted command, the causing Business Event, required Record and
   Workflow transitions, Stock Movements, Posting Sets, allocation changes, and
   invariant results commit as one logical atomic outcome. Either every
   declared effect commits or none does; the later architecture decision may
   choose a persistence technique only if it preserves this outcome.
6. Every accepted governed occurrence creates exactly one Business Event. A
   rejected command creates no Business Event or governed effect and retains
   only its immutable Kernel Command Result and safe diagnostics.
7. Replaying the same Kernel Command Identity and Content Identity returns the
   same Kernel Command Result and produces no duplicate Record transition,
   Business Event, Stock Movement, Ledger Entry, Payment allocation, or cash
   effect. Changed content requires a new command and never bypasses a prior
   rejection.
8. Tenant, Location, active generation, currency, normalized unit, Applied
   Blueprint, Workflow, or expected-state mismatch rejects the whole command.
   The Kernel may not repair, coerce, partially apply, or post a suspense effect.
9. The responsible source, effective time, recorded time, Kernel Command,
   Business Event, Applied Blueprint Reference and Content Identity, policy
   version, and correlation identity remain attributable for every accepted
   effect.
10. AI, Orchestration Runs, interfaces, adapters, reports, and Governed
    Configuration may propose or submit declared inputs but may never calculate
    or mutate authorization, posting, allocation, stock, valuation, Reversal,
    Reconciliation, or reset truth.

#### Money, Posting Set, and account policy contract

Use one functional currency per v1 Sandbox Experience and one closed six-account
taxonomy shared by retail and cafe.

1. The functional currency and its minor-unit exponent are declared by the
   Approved Blueprint from the versioned Kernel registry. Purchase prices, sale
   prices, Payments, stock values, and Ledger Entries use non-negative integer
   minor units; binary floating-point money is forbidden.
2. Every Posting Set contains at least two immutable Ledger Entries, uses one
   currency, and has exactly equal debit and credit totals. Each Ledger Entry
   carries a positive amount and an explicit debit or credit direction. Zero or
   negative entries, cross-currency entries, and cross-Tenant entries are
   rejected.
3. The six v1 ledger-account identities are
   `ledger.account.cash`, `ledger.account.accounts-receivable`,
   `ledger.account.accounts-payable`, `ledger.account.inventory`,
   `ledger.account.sales-revenue`, and
   `ledger.account.cost-of-goods-sold`. Labels may be localized; identities and
   meanings may not change.
4. Ledger account balances and the trial balance are derived only from accepted
   Ledger Entries in the active Sandbox generation. A balance is never stored
   or edited as independent business truth.
5. Every Posting Set links to exactly one Business Event and one declared effect
   group. One Business Event may produce multiple Posting Sets, but each must be
   balanced independently and all required sets still commit atomically. Sale
   fulfillment creates one commercial Posting Set and one inventory-cost
   Posting Set so later commercial Reversal and physical return remain distinct.
6. Each v1 Sandbox generation begins with zero stock, cash, receivable, payable,
   revenue, expense, and ledger balances. A future non-zero opening-balance
   profile requires a separate decision and is absent from v1.
7. Currency conversion, foreign exchange, tax, discounts, tips, supplier
   invoices, write-offs, suspense accounts, and owner-authored ledger mappings
   are unsupported in the v1 proof and fail closed if requested as active
   configuration.

The fixed event-to-effect map is:

| Business occurrence | Stock effect | Posting Set or Sets |
|---|---|---|
| Purchase Order confirmed | None | None |
| Supplier Receipt accepted | Supplier boundary to receiving Location | Debit Inventory; credit Accounts Payable |
| Retail Sale fulfilled | Selling Location to customer boundary | Commercial: debit Accounts Receivable; credit Sales Revenue. Inventory cost: debit Cost of Goods Sold; credit Inventory |
| Cafe Kitchen Ticket first fulfilled | Cafe Location to consumption boundary | Commercial: debit Accounts Receivable; credit Sales Revenue. Inventory cost: debit Cost of Goods Sold; credit Inventory |
| Inbound cash Payment accepted | None | Debit Cash; credit Accounts Receivable |
| Commercial Sale Reversal | None by itself | Debit Sales Revenue; credit Accounts Receivable |
| Accepted return to stock | Customer or declared restoration boundary to Location | Debit Inventory; credit Cost of Goods Sold at the original issued value |
| Outbound cash refund accepted | None | Debit Accounts Receivable; credit Cash |
| Supplier Receipt Reversal | Receiving Location to supplier boundary | Debit Accounts Payable; credit Inventory at the original received value |

#### Purchasing and Supplier Receipt contract

1. Confirming a Purchase Order freezes its supplier, receiving Location, item
   identities, ordered quantities, normalized units, acquisition-price
   snapshots, currency, and governing policy version. Confirmation creates
   purchasing intent only: no stock, payable, Payment, or Ledger Entry exists.
2. A Supplier Receipt may be accepted only against a confirmed, non-cancelled
   Purchase Order for the same Tenant, supplier, Location, item, normalized
   unit, and currency. The responsible receiver and required receiving Evidence
   must be attributable.
3. Every accepted receipt quantity is a positive integer in the item's one
   declared normalized base unit. Cumulative accepted quantity may not exceed
   the ordered quantity. Partial receipts remain explicit; the Golden
   Transaction uses one complete receipt.
4. The receipt's acquisition value is the accepted quantity multiplied by the
   frozen Purchase Order price under the declared integer-minor-unit rule. V1
   has no landed cost, supplier invoice variance, tax, or later repricing.
5. Accepting a Supplier Receipt atomically records the receipt transition and
   Business Event, moves quantity from the supplier boundary to the receiving
   Location, adds the acquisition value to the Stock Position, and posts debit
   Inventory and credit Accounts Payable.
6. Stock becomes on hand and sellable only after that accepted Stock Movement.
   Purchase Order state, screen display, expected delivery, or physical presence
   without Kernel acceptance cannot create stock.
7. Cancelling a Purchase Order closes only its unreceived remainder and creates
   no stock or ledger effect. It never cancels or edits an accepted Supplier
   Receipt.
8. A Supplier Receipt Reversal is allowed only through the accepted Reversal
   contract, only for the full selected receipt effect in v1, and only when the
   original quantity remains available at the receiving Location. It moves the
   quantity back to the supplier boundary and reverses Inventory and Accounts
   Payable at the original value. Otherwise it fails closed until dependent
   effects are separately corrected.

Recognizing Inventory and Accounts Payable at Supplier Receipt is the explicit
v1 simplification. Supplier invoices, goods-received-not-invoiced clearing, and
supplier Payment are outside the Reference Vertical Slice.

#### Stock quantity and moving-weighted-average contract

1. Each item or ingredient declares exactly one normalized stock unit in v1.
   Every Stock Movement carries a positive integer quantity in that unit.
   Runtime unit conversion, fractional base-unit quantity, unit guessing, and
   mixed-unit arithmetic are forbidden; fixtures use `unit`, `gram`, or
   `millilitre` as appropriate.
2. Each Stock Movement names exactly one source and destination. Tenant
   Locations and explicit supplier, customer, consumption, restoration, and
   correction boundaries are distinct; quantity may never appear without an
   accepted movement across one of those boundaries.
3. On-hand quantity for one item at one Location and active generation is the
   signed sum of its immutable Stock Movements. It is independently
   recomputable and never editable. A command that would make on-hand quantity
   negative is rejected before any state, stock, or ledger effect commits.
4. The Kernel assigns every accepted stock-affecting Business Event one
   immutable sequence within its Tenant, Location, and generation. Valuation
   follows this sequence rather than client timestamps, so replay and
   independent recomputation produce the same result.
5. Use moving weighted average as the only v1 Inventory Costing Policy, scoped
   by item, Location, currency, and active generation. A Supplier Receipt adds
   its accepted quantity and acquisition value to the existing quantity and
   value pool.
6. For an issue of quantity `q` from current quantity `Q` and value `V`, the
   issued value is `V` when `q == Q`; otherwise it is the exact rational value
   `V × q ÷ Q` rounded once to the nearest currency minor unit using round-half
   to even. The remaining value is `V - issued value`, so final exhaustion
   absorbs every residual minor unit and leaves quantity and value at zero.
7. Retail returns and authorized ingredient restoration re-enter stock at the
   exact value assigned by the original issue, not the current average. Receipt
   Reversal leaves at the original received value. These linked values then
   participate in the next moving-average calculation.
8. A Stock Position's quantity and value must be independently recomputable
   from Supplier Receipts, Stock Movements, frozen cost inputs, event sequence,
   and the policy version. Every inventory Ledger Entry carries the item and
   Location dimensions needed to compare its control balance with that Stock
   Position.
9. After every accepted stock-affecting Business Event, the aggregate Stock
   Position value must equal the corresponding Inventory ledger control balance
   for the same Tenant, Location, currency, generation, and event boundary. Any
   variance rejects the atomic commit rather than becoming an advisory.
10. Freehand quantity or value adjustment, silent standard cost, FIFO, negative
    stock, reservation, back-order, batch, lot, expiry, transfer, waste, yield,
    write-down, and net-realisable-value policy are absent from the v1 proof.

#### Retail Sale, Payment, and Cash contract

1. Accepting an Order freezes item identities, quantities, normalized units,
   selling-price snapshots, currency, customer or counterparty, Location, and
   allowed choices. It creates commercial intent but no stock or ledger effect.
2. The first valid fulfillment of the accepted Order recognizes one Sale. The
   Kernel must atomically move each item from the selling Location to the
   customer boundary, assign its moving-weighted-average issued value, and post
   receivable, revenue, cost, and Inventory effects under the fixed map.
3. Fulfillment fails closed when the Order is not in the required state, a line
   is changed or already fulfilled, normalized units or currency mismatch, or
   any line lacks sufficient on-hand quantity. No partial line, revenue, cost,
   or stock effect may survive a rejected fulfillment.
4. Cancelling an unfulfilled Order creates no stock or ledger effect. Once Sale
   fulfillment occurred, editing or cancelling the Order cannot alter its
   Business Event, Stock Movements, Posting Set, or balances.
5. Payment remains separate from Sale. An inbound cash Payment must have a
   positive integer-minor-unit amount, the Sandbox functional currency, one
   unique fictitious receipt reference, effective time, responsible Cash Role,
   and exact allocation to the Sale receivable.
6. V1 permits a Payment up to the remaining receivable. A partial Payment leaves
   an explicit positive residual; an overpayment is rejected because v1 has no
   unapplied-funds account. The Golden Transaction uses one full Payment whose
   allocation equals the receivable and whose residual becomes zero.
7. A Payment is Reconciled only when its accepted allocations equal its amount,
   the allocated receivable is fully cleared, currency matches, and the
   independently recomputed residual is zero. No model, user interface, or
   owner acknowledgement may invent a write-off or mark a variance reconciled.
8. Cash Position is derived independently from accepted inbound and outbound
   cash Payments and must equal the `ledger.account.cash` balance for the same
   Tenant, Location, currency, generation, and event boundary.

#### Cafe Order-to-kitchen and Ingredient Consumption contract

1. Order acceptance freezes each Menu Item, selected Modifier, sale price,
   currency, and the simple normalized ingredient requirements supplied by the
   exact Applied Blueprint and Catalog version. A later menu, modifier, recipe,
   or Blueprint edit cannot change the accepted Order or Kitchen Ticket
   snapshot.
2. Kitchen Ticket transitions through accepted, preparing, ready, and fulfilled
   under the declared Workflow. Accepted, preparing, and ready create no
   Ingredient Consumption, Stock Movement, revenue, receivable, cost, or
   Inventory posting.
3. The first valid transition to fulfilled atomically recognizes the Sale and
   creates exactly one Ingredient Consumption Stock Movement per frozen
   ingredient line from the cafe Location to the consumption boundary. It posts
   the same revenue and receivable entries as retail and cost and Inventory at
   the moving-weighted-average value of the consumed ingredients.
4. Modifier ingredient requirements are additive or substitutive only as
   declared by the closed Catalog schema and are frozen in the same snapshot.
   Free text cannot change quantities or create executable recipe meaning.
5. Insufficient ingredient stock, missing or mismatched unit, changed snapshot,
   invalid Kitchen Ticket state, or any failed posting invariant rejects the
   whole fulfillment; the ticket stays unfulfilled and no partial ingredient or
   financial effect commits.
6. Repeated fulfillment with the same Kernel Command returns the recorded
   result and creates no additional Ingredient Consumption, revenue,
   receivable, cost, or Inventory effect. Cancellation before fulfillment has
   no stock or ledger effect.
7. Commercial Reversal or Payment refund after fulfillment never restores
   ingredients automatically. The default cafe profile treats fulfilled
   ingredients as consumed. A separate, authorized restoration Business Event
   may return an ingredient only when attributable Evidence establishes that
   the exact quantity is physically recoverable and safe to return; otherwise
   no stock or cost Reversal occurs.
8. The owner-facing cost is named **ingredient cost**. It excludes labour,
   overhead, waste, yield, batch production, and advanced recipe costing and
   must never be presented as complete menu-item cost or accounting compliance.
9. Cafe Payment and Cash use the exact shared Payment, allocation,
   Reconciliation, Posting Set, and Cash Position contract used by retail.

#### Reversal, return, and refund contract

1. Cancellation prevents a not-yet-effective business occurrence. Reversal
   compensates an already accepted Business Event. A refund is an outbound
   Payment. A physical return or restoration is a separate stock-affecting
   Business Event. None is a synonym or automatic substitute for another.
2. Posted Business Events, Record transitions, Stock Movements, Ledger Entries,
   Payments, and allocations are immutable and non-deletable within their
   active generation. A Reversal creates a new Business Event with its own
   identity, responsible source, effective and recorded times, reason, reviewer,
   Evidence, command, and exact link to the original effect group.
3. A financial Reversal creates equal-and-opposite Ledger Entries for one exact
   selected original Posting Set, against the same accounts, amount, currency,
   dimensions, and original value. It never edits the original Posting Set or
   uses current prices or cost.
4. A financial Reversal never creates an opposite Stock Movement by itself.
   Stock returns only through a separately authorized physical return,
   restoration, or Supplier Receipt Reversal whose Evidence, available
   quantity, condition, original cost link, and Location pass Kernel validation.
5. V1 supports full Reversal of one selected Posting Set and its declared atomic
   effect group. Partial Posting Set Reversal, partial returns, partial refunds,
   exchanges, arbitrary adjustments, and automatic cascade are outside the
   Reference Vertical Slice.
6. Dependent effects follow one declared correction sequence; the Kernel never
   guesses or cascades it. For a paid Sale, a commercial Sale Reversal first
   creates the exact customer credit, an outbound Payment then refunds that
   credit, and a separate accepted physical return restores stock and reverses
   its inventory-cost Posting Set when appropriate. A consumed cafe ingredient
   is not restored merely because the Sale or Payment was reversed.
7. When corrected business meaning must replace the original, the Kernel first
   records the accepted Reversal and then requires a separately authorized new
   command and Business Event for the replacement. Prior approval or equal
   content grants no authority to the replacement.
8. A Reversal fails closed if the original effect is unresolved, already fully
   reversed, cross-Tenant, cross-generation, currency- or unit-incompatible,
   outside Role scope, missing Evidence, stale, or unable to preserve all stock
   and ledger invariants.
9. Reversal is never Sandbox Reset, Blueprint Reversion, migration, deletion,
   backdating, or history repair. Original and compensating effects remain
   queryable together.

#### Reconciliation, audit Evidence, and invariant-report contract

1. Every accepted Kernel Command links to one Kernel Command Result; every
   governed occurrence links to one Business Event; and every resulting Record
   transition, Stock Movement, Posting Set, Payment allocation, Reversal, and
   invariant result links back to that exact Business Event. Each effect is
   caused by exactly one event even when correlation spans a larger journey.
2. Every Business Event declares the effect kinds it is allowed and required to
   produce under the pinned policy. Missing, extra, duplicate, unreferenced, or
   cross-Tenant effects make the atomic outcome invalid.
3. Supplier Receipt requires attributable supplier reference, accepted lines,
   receiver, Location, and acceptance Evidence. Payment requires its unique
   fictitious receipt reference and allocation. Reversal, return, restoration,
   refund, and reset require their exact reason, responsible source, reviewer or
   authorization, original references, and declared Evidence.
4. Every accepted stock or ledger event produces an immutable, machine-checkable
   invariant report containing its Tenant, Location, generation, Applied
   Blueprint, policy and Kernel versions, Business Event, effective and recorded
   times, responsible source, debit and credit totals, Stock Positions, stock
   values, Inventory-control variance, Payment residual, Cash Position, and all
   source identities relevant to that occurrence.
5. The required invariant set is:

   | Invariant | Required result |
   |---|---|
   | Authorization scope | Exact Role, Tenant, Location, action, Workflow, Evidence, and separation rules pass |
   | Event atomicity | Business Event and every declared state, stock, ledger, allocation, and invariant effect all commit or none do |
   | Idempotent effect | One command identity produces at most one accepted effect group |
   | Posting balance | Debit total equals credit total for every Posting Set and currency |
   | Ledger recomputation | Every account and trial-balance result equals the sum of immutable Ledger Entries |
   | Stock quantity | On hand equals the signed Stock Movement sum for every item and Location |
   | Non-negative stock | No accepted event leaves an item or ingredient below zero |
   | Stock value | Value equals deterministic moving-weighted-average recomputation |
   | Inventory control | Recomputed Stock Position value equals the Inventory ledger control balance |
   | Payment residual | Allocations equal the Payment amount, and original receivable equals allocations plus remaining residual without write-off |
   | Cash position | Accepted cash Payments equal the Cash ledger balance |
   | Causation completeness | Every effect and Reversal resolves to its exact Business Event, command, policy, Blueprint, and source |
   | Immutable history | No accepted effect was edited, deleted, silently replaced, or detached from its Reversal lineage |

6. Posting balance, non-negative stock, stock value, Inventory control, Payment
   allocation, cash, causation, and immutability failures are Blocking. They may
   not be acknowledged, suppressed, rounded away, or downgraded to an advisory.
7. Reconciliation reads and compares independently recomputed sources. It never
   posts a balancing entry, changes stock, allocates a Payment, repairs a link,
   or creates authority. A non-zero variance remains explicit and fails the
   required invariant.
8. An invariant report is a derived report, not Evidence by itself. It may
   support Reference Vertical Slice Evidence only when durably preserved with
   its attributable Kernel source, bound versions, exact subject, time, and
   acceptance reference. Operational Agent or orchestration traces cannot
   substitute for it.
9. Rejected commands retain safe diagnostics and attributable control history
   but create no Business Event. Credentials, secrets, Restricted values, and
   unnecessary Confidential data never appear in owner-facing audit material.
10. These controls prove deterministic sandbox behavior only. They are not an
    external audit, audit opinion, IFRS statement, tax return, financial
    statement, or production control certification.

#### Sandbox Reset interaction contract

1. Sandbox Reset follows the separately accepted generation-replacement and
   Reset Authorization contract. It is a destructive Sandbox-only governed
   action, not an accounting Reversal or a method for correcting business truth.
2. Reset atomically activates a prepared replacement generation with explicit
   absence or the exact newly Applied Blueprint. For this v1 profile, the new
   generation begins with zero stock, cash, receivable, payable, revenue,
   expense, Payment residuals, and Ledger Entries.
3. No Record, Business Event, Stock Movement, Ledger Entry, Payment, balance,
   allocation, or participant assignment from the replaced generation may be
   active or referenced as runtime truth in the replacement generation.
4. Blueprint Versions, Blueprint Approvals, Kernel Command Results,
   Provisioning Attempts, Reset Authorization, Reset Attempt, and the durable
   governance history explaining the replacement remain preserved outside the
   discarded runtime generation as required by the Reset contract.
5. Reset succeeds only when the replacement generation passes Tenant and
   Location isolation, zero-balance, zero-stock, empty-effect, Applied Blueprint,
   and generation-reference invariants. Partial retail/cafe reset never counts
   as a clean whole-system reset.
6. Running the same fictitious fixture after reset must produce the same business
   outcomes, quantities, values, postings, residuals, and invariant verdicts,
   apart from newly allocated identities, event sequence, and times.

#### Required negative-path evidence for the later acceptance contract

The Reference Vertical Slice acceptance contract must turn these decisions into
executable scenarios that demonstrate all of the following; this ticket does
not itself mark any scenario accepted:

- reject an unauthorized, cross-Tenant, cross-Location, stale-baseline, or
  separation-of-duty-violating command with no governed effect;
- reject a Posting Set whose debits and credits differ by one minor unit;
- retry Supplier Receipt, retail fulfillment, Kitchen Ticket fulfillment,
  Payment, Reversal, and reset and prove exactly-once effects;
- reject direct edit or deletion of a Business Event, Stock Movement, Ledger
  Entry, accepted Payment, or allocation and use linked Reversal instead;
- reject a Sale or Ingredient Consumption that exceeds available stock;
- reject currency, normalized-unit, generation, Blueprint, and policy mismatch
  instead of coercing them;
- inject a failure between business validation and persistence and prove that
  state, Business Event, stock, ledger, allocation, and invariant results all
  commit or none do;
- prove accepted, preparing, and ready do not consume ingredients, while the
  first fulfilled transition does and replay does not;
- leave a partial Payment explicitly unreconciled and reject an overpayment or
  invented write-off;
- prove commercial Reversal and refund do not restore stock automatically;
- detect a tampered derived stock, ledger, cash, Payment, or causation result by
  independent recomputation; and
- reset each Sandbox, prove no prior-generation runtime truth remains active,
  rerun the fixture, and reproduce the expected invariant outcomes.

#### Standing v1 exclusions

The accepted policies intentionally exclude supplier invoices and supplier
Payment, goods-received-not-invoiced clearing, tax, foreign exchange,
multi-currency posting, discounts, tips, credit limits, write-offs, suspense
accounts, period close, bank or card integration, cash drawers and shifts,
opening balances, inventory transfer, reservation, back-order, batch, lot,
expiry, landed cost, waste, yield, write-down, lower-of-cost-and-net-realisable
value processing, FIFO, standard cost, labour and overhead allocation, advanced
recipe costing, partial return or refund, external audit, production deletion,
and regulatory or accounting compliance claims.

These contracts resolve the v1 authorization, purchasing, Supplier Receipt,
stock, Sale, Payment, balanced-ledger, Ingredient Consumption, Reversal,
Reconciliation, audit Evidence, and Sandbox Reset policy questions for the
fictitious retail and cafe reuse proof.
