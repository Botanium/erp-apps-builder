# 02 — Interview an owner into a safe Intent Brief

**What to build:** A fictitious business owner can use the Guided Cockpit to answer one material question at a time and receive a versioned, attributable Intent Brief that is complete enough to review while unsafe or materially incomplete intent is stopped by explicit Draft Blockers.

**Blocked by:** 01 — Run the empty authority shell.

**Status:** ready-for-agent

- [x] The Owner Interview represents all eight required fact families, including an owner-accepted Not Applicable disposition where permitted.
- [x] Every material statement carries exactly one Intent State and an attributable source; unresolved meaning remains Unknown, Ambiguous, Conflicting, Assumed, or Unsupported rather than being silently treated as Confirmed.
- [x] Every named data category carries exactly one Sensitive Data Class, owner-reviewable rationale, and attributable source, with mixed or unresolved classifications handled at the most restrictive boundary.
- [x] Every Assumption preserves its provisional proposition, proposer, rationale, affected scope, risk if false, resolution condition, responsible reviewer, and any time-sensitive trigger or expiry.
- [x] Every Acceptance Condition preserves the owner-valued outcome, scope, starting context, governed action, observable result, pass or failure boundary, Evidence path, reviewer, criticality, and dependencies.
- [x] A supported complete fixture produces a new immutable Intent Brief version; changed answers never rewrite an earlier version.
- [x] Missing traceability, unsafe handling, unsupported safety profiles, absent owner purpose, or absence of a Confirmed Required Acceptance Condition creates a specific Draft Blocker and no Draft Blueprint.
- [x] Interview completion, preview viewing, option selection, and AI-generated wording create no Blueprint Approval or governed execution authority.
- [x] The interview captures no live credentials, card numbers, identity documents, medical records, Restricted external-AI payloads, or real customer data.
- [x] Public-behavior tests demonstrate both the owner-reviewable happy path and fail-closed blocker paths through the Guided Cockpit.

## Comments

- 2026-08-02 — Claimed for Gate 11 on branch `codex/ticket-02-owner-interview-intent-brief`, stacked from reviewed Ticket 01 head `6afb53d` while draft PR #1 remains unmerged. The TDD public behavior seam must be owner-confirmed before the first failing test; no implementation has begun.
- 2026-08-02 — Botan approved `ReferenceSlice.dispatch` for Owner Interview start, answer, and exact-version review, with `BusinessKernel.observe` used only to prove zero Blueprint Approval, Applied Blueprint, or business truth. Ticket 02 does not use `BusinessKernel.submit`, `AcceptanceEvaluator.evaluate`, private OwnerWorkbench tests, raw Store inspection, or persistence-format assertions.
- 2026-08-02 — Completed through one-test-at-a-time red/green cycles. Thirty-three Ticket 02 public-behavior tests cover all eight fact families, immutable and durable Intent Brief versions, exact historical review projections, Intent States, Sensitive Data Classes, Assumptions, Acceptance Conditions, Draft Blockers, closed typed input rejection, external-AI safety profiles, and the zero-authority boundary. The accumulated suite is 48 tests.
- 2026-08-02 — The local persistence proof uses one ADR-0001 atomic state envelope and one shared revision boundary while `OwnerWorkbenchStatePort` constrains OwnerWorkbench access to interview and Intent Brief history only. Specification review and standards review both finished with zero findings at commit `804b740`; `npm test`, Prettier, and diff checks pass. Human acceptance remains pending, and no merge, push, deployment, external service, or real data is authorized.
- 2026-08-02 — Owner-approved Eve adoption is isolated on `codex/eve-adapter-spike` under ADR 0002. The provider-free Eve Adapter conducts start, answer, and exact-version review only through `ReferenceSlice.dispatch`, and uses `BusinessKernel.observe` only for the negative authority projection. The Ticket 02 public Interfaces and behavior tests remain unchanged; this delivery integration does not record human acceptance, Blueprint Approval, deployment, external service use, or real data.
