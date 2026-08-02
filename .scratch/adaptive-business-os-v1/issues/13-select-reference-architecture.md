# Select the v1 reference architecture

Type: grilling  
Status: resolved
Blocked by: 02, 03, 04, 07, 08, 09, 10

## Question

Which architecture and provisional stack best satisfy the resolved contracts,
local one-command operation, observable state, clean reset, and later
production path without pretending the Reference Vertical Slice is
production-ready?

## Answer

Select a dependency-light Node.js modular monolith for the executable Reference
Vertical Slice, with deep domain Modules, one public Kernel command boundary,
one target-neutral Blueprint compiler, a real local Store seam, and thin
terminal/JSON/static-HTML Adapters. This is the recommended option accepted
under the owner's standing approval for the remaining Wayfinder tickets.

The durable decision and trade-offs are recorded in
[ADR 0001: Dependency-light modular monolith for the Reference Vertical Slice](../../../docs/adr/0001-reference-slice-modular-monolith.md).

## Architecture decision

1. **Deployment shape:** one local process, one repository, one composition
   root, and one writer. This is a modular monolith, not a set of services and
   not a generated application per target.
2. **Runtime:** support the validated Node.js range `>=22.18 <27` and record the
   exact runtime used by each evidence run; the accepted run used Node.js
   `v26.5.0` on Darwin arm64. Use dependency-light ECMAScript Modules and JSDoc
   contracts, npm scripts, and Node built-ins. The slice introduces no live
   model provider, framework agent runtime, database server, container, or
   external service.
3. **Persistence:** use a `StateStore` internal Port with two real Adapters:
   MemoryStore for tests and AtomicJsonStore for the runnable slice. The file
   Adapter commits one complete revision by temporary write and atomic rename
   after Kernel invariants pass. It is local proof durability, not a production
   database claim.
4. **Presentation:** terminal, canonical JSON, and static-HTML Presenters consume
   the same view models. Optional browser review binds only to `127.0.0.1` and
   uses the accepted Guided cockpit plus Evidence workbook interaction model.
   Presentation never bypasses Kernel authority.
5. **Testing:** use `node:test` and `node:assert/strict`; inject deterministic
   time and opaque identities; assert public behavior rather than internal
   calls or raw Store contents.
6. **Packaging:** statically link Kernel Foundation, all eleven Capabilities,
   Policy Profiles, validators, compiler, and declared local Adapters into one
   slice package. Preserve an exact `1.0.0` Machine Identity, manifest, schema,
   content identity, and compatibility record for every independently governed
   contract. Dynamic plugins and tenant runtime extensions remain forbidden.

## Deep Modules

### OwnerWorkbench

Owns the eight fact families, attributable Intent Brief changes, Draft proposal
view, Semantic Diff presentation, uncertainty and exposure summaries, and the
exact owner decision subject. Its Interface produces proposals and review
views only.

### OrchestrationControl

Owns Orchestration Run state, phases, waits, Human Gates, budgets, failures,
retries, observations, and completion evaluation. It may submit exact Kernel
Commands and correlate results, but it owns no governed truth.

### BusinessKernel

Owns all governed validation and mutation behind one small command Interface.
Internal BlueprintEngine, GovernanceEngine, and FinancialInventoryEngine
Modules hide the closed schema, exact approval, provisioning, Workflow, Role,
Evidence, Record, Business Event, stock, ledger, reconciliation, idempotency,
and reset rules. Internal dispatch selects handlers by declared governed-action
identity, never by retail, cafe, Tenant, target label, prompt, or interface.

### AcceptanceEvaluator

Reads exact durable results through the Kernel observation Interface and
evaluates predeclared Completion and Reference Vertical Slice conditions. It is
read-only and cannot repair or create Evidence or business truth.

### ReferenceSlice

Is the composition Module and one-command runner. It wires Modules, Ports,
Adapters, fixtures, and Presenters but owns no business rule.

## Public Interfaces and approved seams

```text
ReferenceSlice.dispatch(OwnerOrControlAction) -> ReferenceSliceView
BusinessKernel.submit(KernelCommand)          -> KernelCommandResult
BusinessKernel.observe(KernelQuery)           -> KernelObservation
AcceptanceEvaluator.evaluate(EvidenceInput)   -> AcceptanceReport
```

- End-to-end owner and orchestration behavior is exercised through
  `ReferenceSlice.dispatch`.
- Every governed mutation and idempotency case is exercised through
  `BusinessKernel.submit`.
- State, stock, ledger, traceability, isolation, and reset results are read
  through `BusinessKernel.observe`.
- Final fail-closed verdicts are exercised through
  `AcceptanceEvaluator.evaluate`.
- `StateStore.transact`, clock, identity generation, validation, compilation,
  and accounting helpers are internal seams. Tests do not reach through public
  Interfaces to assert on them.

Ticket 14 will bind exact scenarios and checks to these four public Interfaces
before Ticket 15 writes its first behavior test.

## One-command outcome

`npm run reference-slice` must create an isolated run directory, execute the
approved fictitious Owner Interview fixture, create and explicitly approve one
exact Draft Blueprint, compile one target-neutral Effective Blueprint, prepare
and apply the retail and cafe target configurations, run both business paths,
evaluate all Required positive and negative conditions, write deterministic
owner-reviewable evidence, reset both targets to new clean-unapplied
generations, re-evaluate the boundary, and return a nonzero exit code on any
Required failure.

The runner may provide an optional local interactive review mode, but acceptance
cannot depend on UI clicks, live external services, or inferred human action.
The owner's standing approval is represented as an explicit attributable
fixture decision over the exact immutable subject, never as interview
completion or preview viewing.

## Production path and exclusions

The selected Interfaces create a credible replacement path for a transactional
database Adapter, compiled TypeScript build, full web client, external model
Adapter, and durable workflow engine. None is selected, installed, simulated as
complete, or granted authority in this ticket. Production authentication,
concurrency, networking, deployment, migrations, backups, billing, observability,
external integrations, real data, and public release require later decisions
and independent evidence.

The full React/ORM web stack, Python-agent-centered service, and distributed
workflow architecture were rejected for the Reference Vertical Slice because
they add framework, migration, replay, and operations variables without
strengthening the business-contract proof. This decision does not prohibit
them behind the accepted Interfaces in a later production architecture.
