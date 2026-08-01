# Ticket 12 logic-prototype evaluation

Date: 2026-08-02  
Scope: in-memory, local, fictitious, non-authoritative logic prototype

## Verdict

Yes. One immutable Blueprint can select the closed v1 Capability union once,
then compile two target profiles that expose different workflows and
experiences while one generic Business Kernel action registry executes both
business paths. No handler branches on `retail`, `cafe`, Tenant identity, or a
vertical application; the differences live in Blueprint target-profile data
and fictitious scenario commands.

The later Reference Vertical Slice should retain this shape: one source
Blueprint contract, one target-neutral compiler, one shared governed-action
registry, independently applied target artifacts, and target-generation state
that never crosses the seam.

## Observed run

The terminal prototype was driven manually through its public commands:

1. Compilation while the Blueprint was Draft was rejected and both targets
   remained clean and unapplied.
2. One explicit action approved the exact Blueprint Reference and Content
   Identity.
3. Compilation produced two Effective Blueprint profiles from that same exact
   source and activated retail and cafe independently.
4. Retail advanced through Purchase Order confirmation, Supplier Receipt,
   Order acceptance, Sale fulfillment, and cash Payment.
5. Cafe advanced through ingredient Purchase Order and Supplier Receipt setup,
   Menu Item plus Modifier Order, Kitchen Ticket accepted, preparing, ready,
   fulfilled with ingredient consumption, and cash Payment.
6. The recomputed invariant report passed after every step and after both
   scenarios completed.
7. Reset replaced both generation 1 targets with clean-unapplied generation 2
   targets, zeroed all active runtime counts and balances, retained the exact
   Blueprint approval, and recorded two reset results.

## Fictitious final state before reset

### Retail

- Widget stock: 6 each, valued at USD 30.00.
- Cash: USD 48.00; Accounts Receivable: USD 0.00; Accounts Payable: USD 50.00.
- Trial balance: USD 98.00 debits equals USD 98.00 credits.
- Five Records, five Business Events, two Stock Movements, and four balanced
  Posting Sets remained target-, Location-, and generation-scoped.

### Cafe

- Beans: 973 g valued at USD 19.46.
- Milk: 1,880 ml valued at USD 18.80.
- Frozen consumption: 27 g beans plus 120 ml milk, costing USD 1.74.
- Cash: USD 9.00; Accounts Receivable: USD 0.00; Accounts Payable: USD 40.00.
- Trial balance: USD 49.00 debits equals USD 49.00 credits.
- Kitchen Ticket states were observed in order: accepted, preparing, ready,
  fulfilled.
- Six Records, eight Business Events, four Stock Movements, and four balanced
  Posting Sets remained target-, Location-, and generation-scoped.

## Design findings absorbed

1. The Blueprint's Capability selections should contain the supported union;
   target profiles then select Role, Workflow, interface, and report exposure.
   Presentation visibility never grants or removes Kernel authority.
2. Compilation must be target-neutral and pure. Each target artifact binds the
   same exact source Blueprint but has a different derived Content Identity.
3. The command dispatcher should resolve a declared governed-action identity
   through a shared registry. Target-specific scenario ordering belongs to
   fixture or orchestration data, not to Kernel conditionals.
4. Applied state, runtime state, and reset remain target-specific even when the
   source Blueprint is shared.
5. Stock and ledger values should be derived from immutable effects, not stored
   as editable balances.

## Prototype limits

The prototype deliberately omits durable persistence, full schema validation,
Role and Evidence enforcement, Human Gate records, retry storage, compatibility
evaluation, canonical JSON, full audit fields, export, and production security.
Its cafe ingredient acquisition uses the shared Purchasing and Receiving
handlers as fixture setup even though those controls are not visible in the
cafe experience profile. Ticket 14 must make that setup authority explicit,
and Ticket 15 must keep it inside the declared sandbox fixture boundary.

These omissions do not invalidate the state-model answer, but none may be
silently treated as production behavior or acceptance evidence.
