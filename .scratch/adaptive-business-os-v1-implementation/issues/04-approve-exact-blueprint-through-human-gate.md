# 04 — Approve one exact Blueprint through a Human Gate

**What to build:** An eligible owner can explicitly approve one unchanged, approval-eligible Draft through a durable Human Gate and idempotent Kernel Command, while stale, changed, replayed, or unauthorized attempts fail without changing authority.

**Blocked by:** 03 — Generate and review an immutable Draft Blueprint.

**Status:** ready-for-agent

- [ ] A durable Orchestration Run reaches Waiting at one Kernel Submission Gate bound to the exact Draft Blueprint Reference, Content Identity, review-bundle identity, Approval Baseline, eligible owner, and freshness boundary.
- [ ] The gate presents one unambiguous explicit Authorize Submission or Decline decision and states that authorization permits only submission of the unchanged command.
- [ ] Interview completion, review viewing, option highlighting, warning acknowledgement, timeout, model output, inferred sentiment, or a prior decision cannot satisfy the gate.
- [ ] Approval Eligibility is atomically recomputed against the current schema, Capability, validator, safety, traceability, compatibility, baseline, and review inputs before the transition.
- [ ] The submitted immutable Kernel Command binds the exact Human Gate Decision, owner attribution, Draft, Content Identity, expected prior state, version set, causation, and one idempotency identity.
- [ ] An Accepted result atomically records one attributable Blueprint Approval and changes only that exact Version from Draft to Approved as the lineage's current approved target.
- [ ] A stale gate, changed subject, ineligible responder, mismatched Content Identity, changed Approval Baseline, expired review, or failed eligibility recheck leaves the Version in Draft with stable safe diagnostics.
- [ ] Exact command replay returns the recorded Kernel Command Result with no duplicate approval; changed content under the same identity produces an Idempotency Conflict with no effect.
- [ ] Blueprint Approval makes the exact Version eligible for a separate provisioning request but does not compile, provision, apply, deploy, or accept the business experience.
- [ ] Public-behavior tests begin with Draft provisioning rejection and end with the exact explicit approval path green.
