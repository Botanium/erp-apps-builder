# Adaptive Business OS v1 — Wayfinder Map

## Destination

Produce an owner-approved, implementation-ready v1 specification and validated
executable Reference Vertical Slice proving that an Owner Interview can create
a Draft Blueprint, explicit Blueprint Approval can authorize it, and one
Business Kernel can provision tailored retail and cafe Sandbox Experiences
through Governed Configuration. The slice must start locally with one command,
execute the accepted retail Golden Transaction and cafe order-to-kitchen flow
with real state transitions, prove stock and balanced-ledger invariants using
fictitious data, and reset cleanly.

## Notes

- This is the canonical local decision map for the intent-first Adaptive
  Business OS v1 effort.
- Product thesis and accepted owner constraints:
  [Platform Blueprint](../../PLATFORM-BLUEPRINT.md).
- Canonical domain language:
  [Domain Context](../../CONTEXT.md).
- Gated working method:
  [Matt Pocock Skill Journey](../../docs/agents/skill-journey.md).
- Local tracker rules:
  [Issue Tracker](../../docs/agents/issue-tracker.md).
- `grilling` and `domain-modeling` govern owner-facing decision tickets;
  `research` and `prototype` govern tickets of those types.
- Permitted execution is limited to cited research, throwaway decision
  prototypes, the executable Reference Vertical Slice, and the specification,
  glossary, decision tickets, and warranted ADRs needed to reach the
  Destination.
- Resolve at most one human-in-the-loop ticket per session. Research tickets
  may run independently when their branch and evidence requirements are met.
- AI may propose only Governed Configuration declared by Configuration Schemas.
  The Business Kernel validates and executes an Approved Blueprint and owns
  authorization enforcement, ledger posting, stock arithmetic, approval truth,
  migrations, and deployment truth.
- Research tickets run on isolated throwaway `research/<name>` branches from
  the owner-authorized local planning baseline. Their results enter `master`
  only after evidence review and ticket resolution.

## Decisions so far

- [Complete the v1 ubiquitous language](issues/01-complete-v1-ubiquitous-language.md): establish distinct canonical boundaries for Capability, Record, Workflow, Role, Evidence, Tenant, Location, Order, Payment, Ledger Entry, Stock Movement, and Business Event; only Business Kernel-recognized occurrences are business truth, while commands, UI actions, and agent traces are not, and immutable Stock Movements and Ledger Entries link to causal Business Events.
- [Research intent-to-blueprint patterns](issues/02-research-intent-to-blueprint-patterns.md): translate conversation into a typed Intent Brief, independently validate and normalize it, preview the immutable Draft Blueprint without side effects, and bind approval to its exact identity; model output is never authority.
- [Research agent control and durable workflow patterns](issues/03-research-agent-control-and-durable-workflows.md): separate agent proposal control, resumable orchestration, and idempotent Business Kernel commands; runtime traces and histories are operational evidence, not business audit truth.
- [Research ledger and inventory invariants](issues/04-research-ledger-inventory-invariants.md): require balanced atomic postings, immutable linked corrections, idempotent stock and ledger effects, independently recomputable reconciliation, and whole-sandbox reset; ticket 09 still owns the v1 policy choices.
- [Define the Intent Brief and Owner Interview contract](issues/05-define-intent-brief-and-interview-contract.md): require a versioned, source-attributed Intent Brief with explicit uncertainty, sensitive-data, Assumption, and Acceptance Condition contracts; permit Draft generation only when it is structurally traceable, safely scoped, and does not invent governed truth.
- [Define the Business Blueprint schema and lifecycle](issues/06-define-blueprint-schema-and-lifecycle.md): use immutable complete Blueprint snapshots with exact lineage and content identity, explicit approval, fail-closed concurrency and compatibility, atomic provisioning, forward-only reversion, and separately authorized Sandbox Reset.
- [Define the Business Kernel and Governed Configuration contract](issues/07-define-kernel-and-configuration-contract.md): make one deterministic Business Kernel the sole governed executor; compose retail and cafe from a closed shared Capability inventory, constrain variation to typed Configuration Points, reject invalid configuration fail-closed, compile one Effective Blueprint, and pin exact versions under directional compatibility declarations.
- [Define the agent control loop and human gates](issues/08-define-agent-control-loop-and-human-gates.md): separate Agent proposals, durable Orchestration control, and Business Kernel truth; require typed Human Gates, idempotent Kernel Commands, bounded budgets, deterministic failure handling, and fail-closed observation before a Run Completion Record may accompany Completed.
- [Define financial, stock, and audit invariants](issues/09-define-financial-stock-and-audit-invariants.md): enforce deny-by-default action scope and atomic exactly-once effects; use single-currency balanced Posting Sets, receipt-time Inventory and payable recognition, fulfillment-time revenue and moving-weighted-average cost, explicit Payment Reconciliation, linked Reversals without automatic stock restoration, and generation-scoped reset.
- [Define the Sandbox Experience data and isolation boundary](issues/10-define-sandbox-data-and-isolation-boundary.md): use one fictitious Tenant with independently scoped retail and cafe targets, generation-bound Kernel reads and actions, an isolation sentinel for executable denial checks, deterministic fictitious fixtures and exports, and atomic reset to a clean-unapplied generation while preserving governance history.
- [Prototype the Owner Interview and Blueprint review](issues/11-prototype-owner-interview-and-blueprint-review.md): use a one-question guided cockpit with source and uncertainty beside a persistent exact-Draft preview, add a complete evidence workbook for pre-approval review, and keep explicit Blueprint Approval as a separate eligible-Draft confirmation; the disposable three-variant prototype is preserved at `bc0c18f`.
- [Prototype Blueprint compilation and business state](issues/12-prototype-blueprint-compiler-and-business-state.md): compile one exact Approved Blueprint into one target-neutral Effective Blueprint, prepare isolated retail and cafe target configurations, and execute both through one shared governed-action registry with recomputable stock, ledger, causation, scope, and clean-reset invariants; the disposable logic prototype is preserved at `396430a`.
- [Select the v1 reference architecture](issues/13-select-reference-architecture.md): build the slice as a dependency-light Node.js modular monolith with deep OwnerWorkbench, OrchestrationControl, BusinessKernel, AcceptanceEvaluator, and ReferenceSlice Modules; use one command, shared governed-action dispatch, MemoryStore and AtomicJsonStore Adapters, four public behavior seams, and statically versioned Capability manifests without claiming production infrastructure.
- [Define the Reference Vertical Slice acceptance contract](issues/14-define-reference-slice-acceptance-contract.md): bind a closed `1.0.0` suite to exact owner-interview, retail, cafe, negative-path, isolation, invariant, reset-and-replay, and evidence conditions; fix literal fixture totals and four public TDD seams, and pass only when both targets finish in verified clean-unapplied generations.
- [Build and evaluate the Reference Vertical Slice](issues/15-build-and-evaluate-reference-vertical-slice.md): preserve corrected isolated evidence at `2237d9e`; all 11 behavior tests and 12 Required acceptance conditions pass through the four approved public Interfaces, the closed six-account and overpayment-rejection rules hold, one Effective Blueprint serves both targets, retail and cafe reach their fixed stock and ledger literals, fail-closed cases preserve effects, deterministic replay matches, and both targets finish clean and unapplied at generation 3.

## Out of scope

- Production deployment, real customer data, real payments, or public release.
- Production authentication, scaling, backups, billing, external integrations,
  or production hardening.
- Arbitrary tenant runtime code or AI-owned authorization, accounting,
  inventory, approval, destructive migration, or deployment truth.
- Clinic and travel verticals.
- Cafe tables, reservations, delivery, tips, loyalty, or advanced recipe
  costing.
- State-preserving Blueprint migration in v1; a Migration Required verdict
  blocks Approval Eligibility and provisioning rather than authorizing a
  transformation.
- Implementation beyond the Reference Vertical Slice before Botan approves the
  v1 specification.
