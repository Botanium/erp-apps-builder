# 06 — Safely evolve and revert an applied Blueprint

**What to build:** An owner can propose, compare, approve, apply, reject, withdraw, or forward-revert configuration changes without overwriting versions, silently merging concurrent meaning, or confusing the lineage's current Approved target with each Sandbox Experience's Applied Blueprint.

**Blocked by:** 05 — Compile once and provision retail and cafe independently.

**Status:** ready-for-agent

- [ ] Editing any historical or current Version creates a new immutable Draft with a fresh Blueprint Reference, Version Number, Content Identity, provenance, parent reference, traceability, and review bundle.
- [ ] Multiple Drafts may share one parent; a stale Approval Baseline leaves the candidate in Draft and produces a refreshed three-way, schema-aware review rather than auto-merging or discarding work.
- [ ] Owner rejection moves only the exact Draft to terminal Rejected and creates no provisioning or runtime effect.
- [ ] Approving a later eligible Draft atomically makes it the lineage's current Approved target and moves the prior Approved Version to Superseded without silently changing either target's Applied Blueprint.
- [ ] Explicit withdrawal moves the exact current Approved Version to Withdrawn while any target already applying it remains unchanged until separately governed action occurs.
- [ ] Target-specific compatibility records exactly one closed verdict with path-level diagnostics; Initial Provision Compatible, In-Place Compatible, and reviewed Reset Required follow their declared paths, while Migration Required, Incompatible, and Indeterminate fail closed in v1.
- [ ] Successful update provisioning uses the ordinary exact request, prepare, and atomic activation protocol; failed or stale activation preserves the prior Applied Blueprint and business state.
- [ ] Forward-only Blueprint Reversion creates a new Draft informed by an exact historical Version, exposes every restored or retained semantic path, and follows normal eligibility, approval, compatibility, and provisioning.
- [ ] Equal historical content never transfers identity, approval, compatibility, provisioning result, Applied state, or runtime truth.
- [ ] Public-behavior tests cover parallel Draft conflict, rejection, supersession, withdrawal, compatibility gating, failed activation, and one complete forward-reversion path.
