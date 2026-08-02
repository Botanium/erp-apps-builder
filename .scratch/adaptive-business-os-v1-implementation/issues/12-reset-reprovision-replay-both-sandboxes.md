# 12 — Reset, reprovision, and replay both sandboxes

**What to build:** An owner can separately authorize destructive replacement of each fictitious Sandbox generation, preserve governance history, reprovision the same exact Approved Blueprint, replay identical business outcomes, and finish with both targets verifiably clean and unapplied.

**Blocked by:** 10 — Enforce the fail-closed governance and invariant matrix; 11 — Pause, resume, budget, retry, correct, and complete a run.

**Status:** ready-for-agent

- [ ] Each Reset Authorization is a separate explicit Human Gate decision bound to the exact Tenant, target, expected Applied Blueprint, active generation, deletion and preservation scope, reason, final target, freshness boundary, and unique idempotency identity.
- [ ] The owner sees every category of fictitious runtime state that will cease to be active, every governance artifact that remains, and whether the target will become clean-unapplied or reprovisioned.
- [ ] Reset authorization and execution use distinct attributable sources and satisfy the declared separation-of-duty boundary.
- [ ] Reset is forbidden when scope or identity is unresolved, a baseline is stale, real or production data may be present, preserved history cannot be separated, an operation conflicts, or the replacement cannot be validated.
- [ ] The Business Kernel prepares an isolated clean or reprovisioned replacement generation before any destructive activation; failure before activation leaves the existing generation and Applied Blueprint unchanged.
- [ ] Activation is one atomic compare-and-set against the exact active generation and Applied Blueprint baseline, after which only the authorized old fictitious runtime scope becomes operationally inaccessible.
- [ ] Retail and cafe reset independently and expose partial failure without claiming whole-system success; exact reset replay returns the recorded result without another generation change.
- [ ] After the first reset, governance history, Blueprint Versions, approvals, validation, compatibility, provisioning, command, and reset records remain queryable while active business state is empty and Applied Blueprint is absent.
- [ ] Both targets reprovision the same exact Approved Blueprint and Effective Blueprint, replay the retail and cafe fixtures, and produce equal canonical business content without transferring run or Version identity.
- [ ] A second independently authorized reset leaves each target on a new generation with explicit absence of Applied Blueprint and zero active Records, Events, runtime Evidence, Stock Movements, Posting Sets, Ledger Entries, Payments, stock, cash, balances, assignments, or pending attempts.
- [ ] Stale or expired authorization, changed scope, conflicting operation, invariant failure, and unknown effect status all fail closed with the prior active generation preserved.
- [ ] Public-behavior tests prove both reset rounds, deterministic replay, preservation, idempotency, partial failure reporting, and final clean observations.
