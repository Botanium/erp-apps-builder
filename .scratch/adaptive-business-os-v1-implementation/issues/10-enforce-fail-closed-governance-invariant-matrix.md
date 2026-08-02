# 10 — Enforce the fail-closed governance and invariant matrix

**What to build:** An owner and reviewer can run a complete negative-path matrix showing that malformed, stale, unauthorized, cross-boundary, financially invalid, or tampered requests fail closed with stable diagnostics and no unintended governed effect.

**Blocked by:** 06 — Safely evolve and revert an applied Blueprint; 09 — Correct business truth without rewriting history.

**Status:** ready-for-agent

- [ ] Every matrix case captures authoritative before-and-after observations so zero unintended effects and zero cross-scope leakage are independently demonstrable.
- [ ] Draft or preview authority, unknown Blueprint properties, unsupported Capability versions, active Assumptions, stale Approval Baselines, and changed Human Gate subjects cannot compile for provisioning, become Applied, or execute governed actions.
- [ ] Exact Kernel Command replay returns one recorded result and one effect, while changed content or bindings under a known command identity produces an Idempotency Conflict and no new effect.
- [ ] Cross-Tenant, target, Location, generation, Applied Blueprint, participant Role, Evidence, and separation-of-duty violations reject without leaking existence or data from another scope.
- [ ] Unbalanced posting, currency mismatch, unit mismatch, undeclared precision, negative stock, ingredient over-consumption, and Inventory-control mismatch reject the entire atomic command.
- [ ] Kitchen accepted, preparing, and ready remain effect-free even under repeat or reordered delivery attempts.
- [ ] Partial Payment preserves the exact receivable residual, an exact remaining Payment reaches zero, and excess Payment rejects because v1 has no unapplied-funds or customer-credit account.
- [ ] Direct mutation or deletion of immutable governed effects is unavailable; attempted formula, stock arithmetic, ledger logic, authorization logic, migration, reset logic, arbitrary code, prompt, secret, or production authority in configuration rejects.
- [ ] Independent recomputation detects tampered stock, ledger, cash, Payment, causation, scope, content identity, or export results and reports failure without repairing or hiding the inconsistency.
- [ ] Identical inputs and bound policy versions produce the same verdict and stable code, path, and identity tuples, with protected values safely redacted.
- [ ] The accumulated public-behavior suite remains green after every negative case and contains no private-state or raw-store assertions.
