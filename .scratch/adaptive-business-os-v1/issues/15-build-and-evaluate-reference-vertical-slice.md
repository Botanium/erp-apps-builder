# Build and evaluate the Reference Vertical Slice

Type: prototype  
Status: resolved
Blocked by: 11, 12, 13, 14

## Question

Does an executable local slice built only to the approved prototype fidelity
validate the chosen architecture, both Sandbox Experiences, and the required
invariants strongly enough to support the v1 specification?

## Answer

The executable local Reference Vertical Slice validates the accepted modular
monolith, authority boundaries, two-target reuse model, and fixed business
invariants strongly enough to support the implementation-ready v1
specification. This is the recommended option accepted under the owner's
standing approval for the remaining Wayfinder tickets.

The isolated implementation is preserved on branch
`codex/reference-slice-v1`:

- source and tests: `f934ef9f77f164c29d6b6fccf857573660766b7c`;
- source-bound acceptance evidence: `8224550`;
- one command: `npm run reference-slice`;
- test command: `npm test`;
- runtime actually observed: Node.js `v26.5.0` on Darwin arm64; and
- supported local range: Node.js `>=22.18 <27`.

The final branch test run passed all 11 behavior tests. The committed
Reference Slice Acceptance Report records `Passed`; all 12 Required conditions
are `Satisfied`; its SHA-256 Content Identity independently recomputes; and its
source binding names clean commit `f934ef9f77f164c29d6b6fccf857573660766b7c`
with source-file Content Identity
`sha256:5c8acaccb1609fd119dac2f6dcc71b2013db945175d16d227e6c99e37c81ec66`.

The slice proves, through the four approved public Interfaces:

1. Owner Interview version 1 creates a Draft with a visible active Assumption;
   preview and premature provisioning create no authority or Applied state.
2. Explicit confirmation creates Intent Brief and Draft Blueprint version 2;
   one exact Human Gate decision permits one idempotent approval Kernel Command.
3. One target-neutral Effective Blueprint compiles once and applies through
   independent compatibility and provisioning records to retail and cafe.
4. The retail Golden Transaction ends at 6 widgets, USD 30.00 Inventory, USD
   48.00 Cash, USD 20.00 Cost of Goods Sold, and a USD 98.00 / USD 98.00
   ending trial balance.
5. The cafe Kitchen Ticket reaches accepted, preparing, ready, and fulfilled;
   only fulfillment consumes 27 g beans and 120 ml milk and posts USD 1.74
   cost; Payment produces the USD 49.00 / USD 49.00 ending trial balance.
6. Schema, stale-baseline, idempotency, Tenant, target, Location, generation,
   Applied Blueprint, Role, stock, unit, currency, posting, Payment, immutable
   effect, and stale-reset cases fail closed or retain their exact explicit
   residual without unintended effects.
7. Each Sandbox Reset uses its own exact authorization and atomic generation
   replacement. Both experiences reprovision and replay with equal business
   content, then finish at generation 3 clean and unapplied while governance
   history remains.
8. The complete proof consumes 75 Kernel deliveries. It preserves the accepted
   48-delivery Balanced Local Slice default and records one explicit bounded
   Budget Gate amendment to 96 before the default would be exceeded. The gate
   grants no governed-action authority.

Canonical evidence on the implementation branch is:

- `.scratch/adaptive-business-os-v1/evidence/reference-slice/acceptance.json`;
- `.scratch/adaptive-business-os-v1/evidence/reference-slice/report.html`; and
- `.scratch/adaptive-business-os-v1/evidence/reference-slice/state.json`.

This resolution authorizes specification synthesis only. The result is a
tested sandbox architecture and contract proof, not owner acceptance,
production implementation, deployment permission, accounting or regulatory
compliance, authentication, scaling, backups, billing, external integrations,
or production hardening. The implementation branch remains isolated and is
not merged into `master` by this decision.
