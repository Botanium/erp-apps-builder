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
