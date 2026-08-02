# 01 — Run the empty authority shell

**What to build:** A local operator can start one deterministic, sandbox-only run that traverses the four approved public Interfaces, persists an empty governed state, rejects an unsupported mutation, and reports honestly that the v1 acceptance objective is not yet satisfied.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] One local command starts from a fresh fictitious Tenant and Sandbox boundary without requiring a network service, external provider, production credential, or real data.
- [ ] The command exercises the owner/control dispatch, Kernel command, Kernel observation, and acceptance-evaluation Interfaces as real end-to-end seams rather than bypassing them.
- [ ] The same observable run works with deterministic in-memory test persistence and atomically replaced single-writer local persistence.
- [ ] An unknown or unsupported Kernel Command is rejected with a stable, safe diagnostic and creates no governed or external effect.
- [ ] The empty target and governance state are observable without inspecting private Module state or raw persistence internals.
- [ ] Evaluation of the empty run is Indeterminate or failed for unmet Required Completion Conditions; it can never report Passed merely because the shell executed.
- [ ] Repeating the empty-run proof preserves deterministic business meaning while allocating fresh run provenance where the contracts require it.
- [ ] One failing public-behavior test is written first, then passes together with the accumulated suite.
