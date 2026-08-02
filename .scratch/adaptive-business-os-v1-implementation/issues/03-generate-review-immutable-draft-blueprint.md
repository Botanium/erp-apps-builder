# 03 — Generate and review an immutable Draft Blueprint

**What to build:** An owner with a safe Intent Brief can generate and inspect one complete, immutable Draft Blueprint and its exact review bundle, including validation, traceability, Semantic Diff, and approval baseline, without gaining provisioning authority.

**Blocked by:** 02 — Interview an owner into a safe Intent Brief.

**Status:** ready-for-agent

- [ ] The Draft is a self-contained Blueprint Version with an immutable envelope and all eleven required canonical sections under one supported closed Configuration Schema.
- [ ] Tenant, Blueprint, Version, parent, and source Intent Brief identities are exact and resolvable; labels, sequence numbers, timestamps, and latest selectors cannot substitute for an exact Blueprint Reference.
- [ ] Active Governed Configuration uses only declared Configuration Points and exact supported Capability versions; unknown properties, arbitrary code, formulas, runtime prompts, credentials, and tenant-specific executable behavior fail closed.
- [ ] Canonicalization validates before hashing, makes every material value explicit, produces deterministic canonical JSON, and records an independently recomputable Blueprint Content Identity.
- [ ] Configuration validation returns one closed verdict and stable project-owned diagnostics with exact paths, identities, bound versions, safe redaction, and deterministic ordering.
- [ ] The review bundle binds the unchanged Draft, exact Content Identity, normalized Blueprint, Approval Baseline, validation report, data-exposure summary, Acceptance Condition coverage, Assumptions, exclusions, Unsupported intent, and a schema-aware Semantic Diff.
- [ ] A serialization-only change produces no Semantic Diff, while every owner-reviewed semantic or presentation-content change changes canonical content and is visible.
- [ ] An active Assumption or other non-Confirmed intent cannot drive approval-eligible configuration; resolving it creates an attributable Intent Brief update and a new Draft rather than mutating the candidate.
- [ ] Viewing or validating the Draft does not change its Draft Lifecycle State, create Blueprint Approval, compile an authoritative artifact, or provision either Sandbox Experience.
- [ ] Public-behavior tests prove the complete review path and representative deterministic rejection paths.

## Comments

- 2026-08-02 — ADR 0002 adds Eve only as a removable outer delivery Adapter. Ticket 03 must continue to generate and review Draft Blueprint behavior through `ReferenceSlice.dispatch`; Eve session state, tool approval, and traces cannot become Blueprint content, Blueprint Approval, validation truth, or a new public business-authority seam.
- 2026-08-03 — Claimed for Gate 11 on branch `codex/ticket-03-immutable-draft-blueprint`, based on owner-accepted integration commit `df079f5`. The public behavior seam must be owner-approved before the first failing test. No Ticket 03 test or implementation has begun; push, deployment, external services, production authority, and real data remain excluded.
