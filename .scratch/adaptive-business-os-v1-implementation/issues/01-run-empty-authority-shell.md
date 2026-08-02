# 01 — Run the empty authority shell

**What to build:** A local operator can start one deterministic, sandbox-only run that traverses the four approved public Interfaces, persists an empty governed state, rejects an unsupported mutation, and reports honestly that the v1 acceptance objective is not yet satisfied.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [x] One local command starts from a fresh fictitious Tenant and Sandbox boundary without requiring a network service, external provider, production credential, or real data.
- [x] The command exercises the owner/control dispatch, Kernel command, Kernel observation, and acceptance-evaluation Interfaces as real end-to-end seams rather than bypassing them.
- [x] The same observable run works with deterministic in-memory test persistence and atomically replaced single-writer local persistence.
- [x] An unknown or unsupported Kernel Command is rejected with a stable, safe diagnostic and creates no governed or external effect.
- [x] The empty target and governance state are observable without inspecting private Module state or raw persistence internals.
- [x] Evaluation of the empty run is Indeterminate or failed for unmet Required Completion Conditions; it can never report Passed merely because the shell executed.
- [x] Repeating the empty-run proof preserves deterministic business meaning while allocating fresh run provenance where the contracts require it.
- [x] One failing public-behavior test is written first, then passes together with the accumulated suite.

## Comments

- 2026-08-02 — Claimed for Gate 11 on branch `codex/ticket-01-empty-authority-shell`. Botan confirmed the four canonical public behavior seams and a thin command smoke boundary. The isolated reference prototype branch remains excluded.
- 2026-08-02 — Completed through one-test-at-a-time red/green cycles at the four approved public seams. Fifteen accumulated tests now cover the empty operator journey, closed and content-bound Kernel Commands, durable exact replay and idempotency conflict, fail-closed Tenant scope, unsupported mutation rejection, public empty-state observation, MemoryStore/AtomicJsonStore parity and reopen, fresh provenance, Indeterminate acceptance, and the thin command delivery check.
- 2026-08-02 — Review blockers were resolved without widening Ticket 01: public JSDoc contracts were added, stable contract identities were centralized, initialization can no longer replace an existing Tenant scope, and local JSON state reopens rather than being silently replaced. `npm test` and Prettier verification pass on Node `v22.23.1`; `npm run --silent reference-slice` intentionally exits `1` because the empty shell truthfully reports `Indeterminate` rather than `Passed`.
- 2026-08-02 — Gate 13 handoff opened as draft PR [Botanium/erp-apps-builder#1](https://github.com/Botanium/erp-apps-builder/pull/1), from `codex/ticket-01-empty-authority-shell` into `master` in the private repository. GitHub reports the PR open, draft, and mergeable, with no configured status checks. Human review and acceptance remain pending; no merge or deployment is authorized.
