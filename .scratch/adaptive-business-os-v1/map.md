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

## Not yet specified

- Release packaging for versioned Capabilities and declared adapters after the
  v1 reference architecture is selected; tenant runtime extensions remain out
  of scope.
- The final acceptance-seam matrix after public interfaces and prototype
  verdicts exist.

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
