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
  the owner-authorized local planning baseline. Research results remain
  unmerged until their evidence and ticket resolution are reviewed.

## Decisions so far

_None yet. Gate 1 fixed the Destination and scope before map creation._

## Not yet specified

- Capability-pack packaging, versioning, and extension semantics after the
  Business Kernel boundary is resolved.
- Blueprint compatibility, migration, and rollback detail after schema
  lifecycle and execution-graph decisions are resolved.
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
- Implementation beyond the Reference Vertical Slice before Botan approves the
  v1 specification.
