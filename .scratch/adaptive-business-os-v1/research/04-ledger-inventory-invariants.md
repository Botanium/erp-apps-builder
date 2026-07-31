# Ledger and inventory invariants for the v1 proof

Research for
[Research ledger and inventory invariants](../issues/04-research-ledger-inventory-invariants.md).

Research date: 2026-07-31
Scope: fictitious retail Golden Transaction and cafe Ingredient Consumption in
the local Reference Vertical Slice only

## Scope and evidence boundary

This note identifies the minimum invariants that the Reference Vertical Slice
should prove. It does not select a database, accounting product, tax treatment,
jurisdiction, production control framework, or final chart of accounts.

The sources have two different authority levels:

1. **Accounting guidance.** IAS 2 and the IFRS Conceptual Framework describe
   recognition, measurement, and useful-information principles. The
   [IFRS Foundation explicitly says the Conceptual Framework is not itself a
   Standard](https://www.ifrs.org/issued-standards/list-of-standards/preface-to-ifrs-standards/).
2. **Implementation conventions.** TigerBeetle, Modern Treasury, and Odoo are
   maintained first-party implementations or product documentation. They are
   evidence for robust software controls, not accounting standards and not a
   recommendation to adopt those products.

The resulting candidate invariants are therefore engineering requirements for
the sandbox proof. They must not be represented as a claim of IFRS, audit, tax,
or jurisdictional compliance.

## Authoritative accounting evidence

### Inventory recognition and measurement

- IAS 2 measures inventory at the lower of cost and net realisable value. Cost
  includes purchase, conversion, and other costs needed to bring inventory to
  its present location and condition. It permits specific identification for
  non-interchangeable items and FIFO or weighted average for ordinarily
  interchangeable items. When inventory is sold, its carrying amount is
  recognised as expense in the period of the related revenue. See the
  [IFRS Foundation's IAS 2 summary](https://www.ifrs.org/issued-standards/list-of-standards/ias-2-inventories/)
  and IAS 2 paragraphs 9-11, 23-25, and 34.
- The IFRS Conceptual Framework paragraph 5.5 uses a cash sale of goods to show
  simultaneous recognition of income from cash and expense from derecognising
  the goods. Paragraphs 5.26-5.28 describe derecognition when an asset is
  consumed or transferred. See the
  [IFRS Conceptual Framework](https://www.ifrs.org/issued-standards/list-of-standards/conceptual-framework/).
- The Conceptual Framework paragraphs 2.30-2.31 say verifiability can be direct
  or indirect and specifically use inventory as an example: check quantities
  and costs, then recalculate ending inventory with the same cost-flow
  assumption. That supports independently recomputable quantity and value
  proofs; it does not mandate a particular database or event model. See the
  [official 2024 issued Framework PDF](https://www.ifrs.org/content/dam/ifrs/publications/pdf-standards/english/2024/issued/part-a/conceptual-framework-for-financial-reporting.pdf?bypass=on).

### What the accounting sources do not establish

The cited accounting material does **not** require an append-only application
ledger, a particular double-entry API, idempotency keys, atomic database
transactions, event sourcing, hash chains, a purchase-order posting policy, or
a sandbox reset mechanism. It also does not determine whether this prototype's
`purchase` step should recognise a payable before receipt. Those are system and
accounting-policy choices that must be made explicitly.

IAS 2 also says conversion cost can include direct labour and systematic
production overhead. A v1 cafe proof that values only consumed ingredients is
therefore a deliberately narrow operational costing proof, not evidence of
complete production costing or IFRS-compliant financial statements.

## First-party implementation evidence

### Balanced, atomic, immutable ledger records

- Modern Treasury documents transaction-level and per-currency equality of
  debits and credits, account balances derived from entries, ledger isolation,
  idempotency, and all-or-nothing entry writes in its
  [Ledgers Guarantees](https://docs.moderntreasury.com/ledgers/docs/ledgers-guarantees).
- Its transaction lifecycle separates mutable pending records from posted
  records. Posted records are immutable; undoing them requires a second
  reversing transaction. See
  [Transaction Status and Balances](https://docs.moderntreasury.com/ledgers/docs/transaction-status-and-balances).
- TigerBeetle defines a transfer as immutable, uniquely identified, and
  non-deletable; errors use correcting transfers. See its
  [Transfer reference](https://docs.tigerbeetle.com/reference/transfer/) and
  [Correcting Transfers recipe](https://docs.tigerbeetle.com/coding/recipes/correcting-transfers/).
- TigerBeetle's maintained source architecture uses an immutable, hash-chained,
  append-only prepare log, stores past transfers for idempotence, and expects an
  end-to-end unique ID from the application. That is strong implementation
  evidence for retaining history and making retries safe, not a requirement to
  use TigerBeetle. See the project's
  [Architecture](https://github.com/tigerbeetle/tigerbeetle/blob/main/docs/ARCHITECTURE.md#overview)
  and
  [system-design notes](https://github.com/tigerbeetle/tigerbeetle/blob/main/docs/ARCHITECTURE.md#systems-thinking).

### Stock, valuation, and reconciliation are separate but linked views

- Odoo's first-party inventory-valuation documentation explicitly distinguishes
  physical item movement from accounting valuation timing, supports FIFO,
  average cost, and standard cost, and provides a stock-variation reconciliation
  between posted inventory value and remaining stock movements. This is useful
  implementation evidence that quantity state, valuation state, and their
  reconciliation should be independently visible. It is not standard-setting
  authority. See
  [Odoo 19 Inventory valuation](https://www.odoo.com/documentation/19.0/applications/finance/accounting/get_started/inventory_valuation.html).
- Odoo's first-party reconciliation flow matches cash transactions to existing
  invoice, bill, or payment items; an unmatched remainder stays open or requires
  an explicit write-off account. See
  [Odoo 19 Bank reconciliation](https://www.odoo.com/documentation/19.0/applications/finance/accounting/bank/reconciliation.html).
- Modern Treasury likewise defines account reconciliation as comparing an
  internal ledger balance with a bank- or vendor-reported balance and exposing
  the variance. Its matching rules preserve partial reconciliation until the
  matched amounts equal the expectation. See
  [Account Reconciliation](https://docs.moderntreasury.com/ledgers/docs/account-reconciliation)
  and
  [Defining Reconciliation Rules](https://docs.moderntreasury.com/payments/docs/defining-reconciliation-rules).

The v1 slice has no external bank feed. Its cash proof can still reuse the
essential convention: record an independently identifiable fictitious cash
receipt, match it to the sale receivable, and require a zero residual before
calling it reconciled.

## Candidate v1 invariants

These are recommendations for tickets that define the Business Kernel contract;
they are not resolved architectural decisions.

### 1. Posting and balance

1. Every posted journal transaction has at least two entries and, for each
   currency, `sum(debits) == sum(credits)`. A failure rejects the whole
   transaction.
2. Every entry has a stable transaction ID, account ID, amount in integer minor
   units, currency, effective time, recorded time, business-event ID, and
   tenant/sandbox ID. Zero or negative entry amounts are rejected; direction is
   represented explicitly as debit or credit.
3. Account balances and the trial balance are derived from posted entries. The
   slice must prove total debits equal total credits after every posting, not
   only at the end.
4. A business-event idempotency key can cause at most one posting. Replaying a
   command with the same key returns the same result and creates no new stock or
   ledger effect.
5. A posted transaction and its balance-affecting entries cannot be edited or
   deleted. Correction creates a linked reversal and, when needed, a new
   replacement posting. Both original and correction remain queryable.
6. Cross-tenant and cross-currency entries in one v1 journal transaction are
   rejected. Foreign exchange is out of scope.

### 2. Stock movement and valuation

1. On-hand quantity is a projection of immutable movements, never a freehand
   balance edit. Each movement records item/ingredient, normalized unit,
   positive quantity, source, destination, effective time, business-event ID,
   and idempotency key.
2. Each movement conserves quantity across modeled locations. Supplier,
   customer, consumption, and adjustment are explicit boundary locations; a
   receipt moves quantity from supplier to stock, while a sale or Ingredient
   Consumption moves it from stock to the appropriate sink.
3. A posted movement is corrected only by a linked opposite movement. The
   original remains visible.
4. Units are not mixed without an explicit exact conversion. V1 fixtures should
   use a single stock unit per item or ingredient and integer base-unit
   quantities.
5. V1 rejects any command that would make available on-hand quantity negative.
   Reservation and back-order semantics are out of scope unless a later ticket
   adds them.
6. Quantity and value are independently recomputable. For every stock event,
   the resulting stock quantity must equal the signed movement sum, and stock
   value must equal the unconsumed quantity valued by the selected formula.
7. Use one declared cost formula consistently per item. Weighted average is the
   recommended v1 default because IAS 2 permits it for interchangeable items and
   it keeps the fixture compact. FIFO remains a legitimate later alternative;
   standard cost should not be silently substituted.
8. A stock-affecting business event and its accounting posting commit together,
   or neither does. This avoids a successful stock receipt with a failed ledger
   entry and the inverse.

### 3. Minimal retail event-to-entry contract

The following is a recommended sandbox policy, not a jurisdictional rule:

| Business event | Stock effect | Balanced posting |
|---|---|---|
| Purchase order confirmed | None; commitment only | None |
| Goods received | Increase item stock at declared acquisition cost | Debit Inventory; credit Accounts Payable |
| Sale fulfilled | Decrease sold item stock at selected cost | Debit Cost of Goods Sold; credit Inventory; debit Accounts Receivable; credit Sales Revenue |
| Fictitious payment received | None | Debit Cash; credit Accounts Receivable |
| Return or correction | Linked opposite movement when applicable | Linked reversing transaction, then replacement if needed |

For v1, treating receipt as the recognition point for both Inventory and
Accounts Payable deliberately avoids goods-received-not-invoiced and vendor-bill
timing complexity. Ticket 09 must accept or replace that policy. Purchase order
confirmation must never create stock or a ledger effect merely because it
precedes receipt in the workflow.

### 4. Minimal cafe event-to-entry contract

1. Menu Item and Modifier selection freezes the applicable basic ingredient
   quantities on the Order or fulfillment snapshot. Later recipe edits cannot
   change an already fulfilled ticket.
2. `accepted`, `preparing`, and `ready` Kitchen Ticket transitions do not consume
   stock or post financial entries.
3. The first valid transition to `fulfilled` creates exactly one Ingredient
   Consumption movement per frozen ingredient line and exactly one linked cost
   posting: debit Cost of Goods Sold and credit Inventory for the consumed
   ingredients' weighted-average value.
4. Fulfillment also recognises the sale: debit Accounts Receivable and credit
   Sales Revenue. A later fictitious payment debits Cash and credits Accounts
   Receivable.
5. Retrying or replaying fulfillment creates no additional consumption,
   revenue, receivable, or cost. Reversing fulfillment requires explicit linked
   compensating records; a Kitchen Ticket state edit alone cannot undo posted
   effects.
6. Ingredient-only cost is named `ingredient cost` in the proof. It excludes
   labour, overhead, waste/yield, batch production, and advanced recipe costing
   and must not be presented as complete cafe product cost.

### 5. Reconciliation and audit evidence

1. Every ledger transaction and stock movement links back to exactly one
   business event; every event that declares a stock or ledger effect links to
   the resulting immutable records.
2. The payment event carries an independent fictitious receipt ID. It is
   `reconciled` only when allocated payment equals the sale receivable, currency
   matches, and residual is zero. Partial or excess allocation remains explicit;
   v1 must not invent a write-off.
3. The slice emits a machine-checkable invariant report after each state
   transition: debit/credit totals, on-hand quantities, stock value, payment
   residual, and source IDs.
4. The final report must reconcile the inventory control-account balance to the
   independently recomputed stock valuation for the fixture. Any variance is a
   failing result, not an informational warning.
5. Recorded time, effective time, actor/system identity, causation ID,
   correlation ID, Blueprint version, and reversal links remain queryable for
   each effect.

### 6. Clean sandbox reset

Reset is a test-fixture concern, not an accounting correction:

1. Reset must discard the entire fictitious sandbox run and recreate it from a
   known empty/seed state; it must not delete selected posted records while
   retaining derived balances.
2. A run has a unique run ID. Reset creates a new run ID, zero opening stock and
   ledger balances (except explicitly declared seed balances), and no references
   to records from the prior run.
3. Running the same fixture after reset produces the same business outcomes and
   invariant totals, apart from documented identifiers and timestamps.
4. Reset never crosses the sandbox boundary and cannot target production or real
   customer data.

## Failure cases the slice should demonstrate

- Reject a journal transaction whose debits and credits differ by one minor
  unit.
- Retry receipt, sale fulfillment, Kitchen Ticket fulfillment, and payment with
  the same idempotency key and prove no duplicate effect.
- Reject direct mutation or deletion of posted ledger entries and stock
  movements; show a linked reversal instead.
- Reject a sale or ingredient consumption that exceeds available stock.
- Reject unit mismatch and currency mismatch rather than coercing them.
- Inject a failure between business validation and persistence and prove stock
  plus ledger commit together or not at all.
- Show that `ready` does not consume ingredients, while the first `fulfilled`
  transition does and repeated fulfillment does not.
- Leave a mismatched payment unreconciled with an explicit residual; do not
  auto-write it off.
- Tamper with a derived stock total or ledger projection and prove independent
  recomputation detects the variance.
- Reset and rerun; prove the new sandbox has no prior-run effects and reaches
  the same expected totals.

## V1 implications

- The Business Kernel, not AI-generated configuration, owns posting rules,
  stock arithmetic, idempotency, atomicity, reversals, and invariant checks.
- Governed Configuration may choose only from declared accounts, event types,
  units, and supported cost formulas. It may not provide formulas or arbitrary
  code that calculates postings or stock.
- The Blueprint must declare the cost formula and basic ingredient quantities,
  and Blueprint Approval must freeze the version used by each run.
- The Reference Vertical Slice needs explicit negative-path tests, not only a
  visually successful Golden Transaction.
- The trial balance, stock movement journal, valuation reconciliation, payment
  reconciliation, and source-event trace should be inspectable outputs of the
  proof.

## Unresolved decisions

1. Whether ticket 09 accepts the simplified receipt posting (Inventory / AP) or
   introduces vendor bills and a GRNI clearing account.
2. Whether sale recognition occurs at fulfillment or at a separate invoicing
   state. Fulfillment is recommended for the narrow proof.
3. Whether weighted average is accepted as the only v1 formula or FIFO must also
   be demonstrated.
4. Whether reversal restores stock automatically or requires a separately
   authorised return movement linked to the financial reversal.
5. Which exact account taxonomy, unit precision, rounding rule, and minor-unit
   constraints the kernel supports.
6. Whether the prototype persists one atomic transaction for business state,
   stock, and ledger, or uses an append-only event plus deterministic projections
   with an explicit consistency proof.

## Recommendation

Adopt the six invariant groups above as the evidence baseline for ticket 09,
with four explicit v1 policy defaults: purchase order has no effect; receipt
posts Inventory / Accounts Payable; sale or cafe fulfillment posts revenue plus
cost; fictitious payment clears Accounts Receivable to Cash. Use weighted
average and ingredient-only costing, label both as narrow v1 policies, and test
balanced atomic posting, append-only reversal, idempotency, quantity/value
reconciliation, zero payment residual, and whole-sandbox reset.

This is sufficient to prove a shared deterministic kernel across retail and
cafe without claiming full ERP, production accounting, tax, audit, or advanced
recipe-costing coverage.
