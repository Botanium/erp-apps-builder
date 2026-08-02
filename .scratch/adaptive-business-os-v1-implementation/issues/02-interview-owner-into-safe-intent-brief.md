# 02 — Interview an owner into a safe Intent Brief

**What to build:** A fictitious business owner can use the Guided Cockpit to answer one material question at a time and receive a versioned, attributable Intent Brief that is complete enough to review while unsafe or materially incomplete intent is stopped by explicit Draft Blockers.

**Blocked by:** 01 — Run the empty authority shell.

**Status:** ready-for-agent

- [ ] The Owner Interview represents all eight required fact families, including an owner-accepted Not Applicable disposition where permitted.
- [ ] Every material statement carries exactly one Intent State and an attributable source; unresolved meaning remains Unknown, Ambiguous, Conflicting, Assumed, or Unsupported rather than being silently treated as Confirmed.
- [ ] Every named data category carries exactly one Sensitive Data Class, owner-reviewable rationale, and attributable source, with mixed or unresolved classifications handled at the most restrictive boundary.
- [ ] Every Assumption preserves its provisional proposition, proposer, rationale, affected scope, risk if false, resolution condition, responsible reviewer, and any time-sensitive trigger or expiry.
- [ ] Every Acceptance Condition preserves the owner-valued outcome, scope, starting context, governed action, observable result, pass or failure boundary, Evidence path, reviewer, criticality, and dependencies.
- [ ] A supported complete fixture produces a new immutable Intent Brief version; changed answers never rewrite an earlier version.
- [ ] Missing traceability, unsafe handling, unsupported safety profiles, absent owner purpose, or absence of a Confirmed Required Acceptance Condition creates a specific Draft Blocker and no Draft Blueprint.
- [ ] Interview completion, preview viewing, option selection, and AI-generated wording create no Blueprint Approval or governed execution authority.
- [ ] The interview captures no live credentials, card numbers, identity documents, medical records, Restricted external-AI payloads, or real customer data.
- [ ] Public-behavior tests demonstrate both the owner-reviewable happy path and fail-closed blocker paths through the Guided Cockpit.

## Comments

- 2026-08-02 — Claimed for Gate 11 on branch `codex/ticket-02-owner-interview-intent-brief`, stacked from reviewed Ticket 01 head `6afb53d` while draft PR #1 remains unmerged. The TDD public behavior seam must be owner-confirmed before the first failing test; no implementation has begun.
