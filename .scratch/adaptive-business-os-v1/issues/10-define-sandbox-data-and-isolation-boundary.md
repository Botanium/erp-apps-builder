# Define the Sandbox Experience data and isolation boundary

Type: grilling  
Status: resolved
Blocked by: 01, 06, 07, 09

## Question

What tenant, location, role, fictitious-data, reset, export, and isolation
semantics must the Reference Vertical Slice prove without turning into
production infrastructure?

## Answer

Use one fail-closed, target-and-generation-scoped local Sandbox boundary. It
must make the reuse proof observable without claiming that logical sandbox
isolation is production security. This is the recommended option accepted
under the owner's standing approval for the remaining Wayfinder tickets.

### Reference Slice shape

1. The positive proof uses one explicitly fictitious Tenant with two named
   operational Locations: one retail Location and one cafe Location. It owns
   two independently identified Sandbox Experiences, `retail` and `cafe`.
   Each target records its own Applied Blueprint and active Sandbox Generation.
2. A separate empty isolation-sentinel Tenant and Location exist only for
   negative checks. They receive no positive fixture, Blueprint Approval,
   Applied Blueprint, or business effect. Their presence makes cross-Tenant
   denial executable rather than an assertion.
3. Every Sandbox Experience, Sandbox Generation, Record, Workflow transition,
   Evidence instance, Business Event, Stock Movement, Ledger Entry, Posting
   Set, Payment, participant assignment, derived balance, Kernel Command, and
   Kernel Command Result carries or resolves an exact Tenant identity. Every
   Location-scoped item additionally resolves one Location owned by that
   Tenant. Runtime items also bind the exact Sandbox Experience and active
   Sandbox Generation.
4. Tenant, Sandbox Experience, Location, active generation, Applied Blueprint,
   Role scope, and expected prior state are authority-relevant Kernel Command
   inputs. A missing, stale, mismatched, cross-Tenant, cross-target,
   cross-Location, or prior-generation reference fails closed before any
   governed effect.
5. The retail and cafe targets are not Tenants, vertical applications,
   databases, or authorization domains. They are independently provisioned
   local targets inside the one fictitious Tenant. Shared-kernel reuse is
   demonstrated by exact shared Capability and policy identities, not by
   sharing runtime Records or mutable state between targets.

### Fictitious-data contract

1. Every input used by the Reference Vertical Slice must originate in one
   immutable, content-identified Sandbox Fixture or in an attributable explicit
   human decision over that fixture. The fixture names its Tenant, target,
   Location, normalized units, currency, deterministic identifiers, effective
   times, participant personas, business inputs, and expected scope.
2. Fixture values are deliberately invented and visibly labelled `fictitious`.
   They may not be copied, sampled, anonymized, pseudonymized, or inferred from
   real customers, employees, payments, bank accounts, credentials, identity
   documents, medical records, production databases, exports, logs, or unknown
   sources.
3. Every named fixture data category retains a Sensitive Data Class and
   rationale even though its values are fictitious. The v1 fixture contains no
   Restricted data, credentials, secrets, full payment details, government
   identifiers, clinical data, or external-AI payloads. A value whose origin or
   classification is uncertain blocks the run rather than being treated as
   safe sample data.
4. A Sandbox Fixture is non-authoritative input. It never creates opening
   stock, cash, balances, Records, Business Events, Evidence, Stock Movements,
   or Ledger Entries directly. The active generation begins at the zero state
   fixed by the financial, stock, and audit contract; only accepted, typed,
   idempotent Kernel Commands may create runtime truth.
5. Deterministic identities and times may be derived from the fixture for
   reproducible local evidence, but they remain scoped to this sandbox run and
   cannot be reused as production identities or authority.

### Role, Location, and read isolation

1. The slice uses fictitious participant identities assigned to Blueprint Roles
   for the minimum proof duties. Participant assignment is target-generation
   runtime state, not authentication. Production login, identity proofing,
   sessions, password handling, and account recovery remain absent.
2. A Role assignment is always narrowed by Tenant and by its declared Location
   or Record scope. Presentation visibility never grants authority. The same
   participant label in another Tenant, target, Location, or generation has no
   implied assignment.
3. Reads, reports, dashboards, derived Stock Positions, Cash Positions,
   reconciliations, invariant reports, and exports apply the same Tenant,
   target, generation, Location, and Role scope as commands. Cross-boundary
   joins, totals, search results, references, and error details are forbidden.
4. A denied lookup reveals no protected object content and creates no business
   truth. Safe diagnostics may state which boundary class failed without
   disclosing the other Tenant's or target's data.

### Runtime and governance separation

1. Exactly one Sandbox Generation is active for each Sandbox Experience.
   Records, runtime Evidence instances, Business Events, Stock Movements,
   Ledger Entries, Posting Sets, Payments, balances, stock, cash, participant
   assignments, and scenario fixtures belong to that generation and cannot be
   active in another.
2. Intent Briefs, Blueprint Versions and Content Identities, lifecycle and
   approval records, validation reports, Semantic Diffs, Compatibility
   Verdicts, Provisioning Attempts, Kernel Command Results needed for durable
   governance, Reset records, and prototype verdicts remain outside the
   replaceable runtime generation and reference it when relevant.
3. Runtime facts may reference their exact Applied Blueprint, governed action,
   and policy Version Set, but a Blueprint or export never absorbs or mutates
   those runtime facts.
4. No interface, prototype shell, fixture loader, AI output, or direct storage
   write may bypass the Business Kernel to create or alter generation state.

### Reset boundary

1. Reset follows the already accepted explicit Reset Authorization,
   idempotency, preparation, and atomic generation-replacement contract. The
   Reference Vertical Slice must prove reset-to-clean separately for retail and
   cafe and then report the combined result without hiding partial failure.
2. Its accepted final state is a new active generation for each target with
   explicit absence of an Applied Blueprint and zero active runtime Records,
   Business Events, Evidence instances, Stock Movements, Ledger Entries,
   Posting Sets, Payments, balances, stock, cash, assignments, and pending
   attempts. The old generation is operationally inaccessible.
3. Reset preserves the governance history listed above, including the exact
   Reset Authorization and before-and-after generation identities. It never
   deletes or rewrites Blueprint or audit truth and never claims production
   deletion, backup restoration, disaster recovery, or migration.
4. Re-running the same Sandbox Fixture after reset must begin from zero and
   reproduce the same declared business outcomes and invariant values while
   allocating new occurrence identities where the governing identity contract
   requires them.

### Sandbox Export boundary

1. Each target may produce one deterministic canonical-JSON Sandbox Export
   bound to its exact Tenant, Sandbox Experience, active generation, Applied
   Blueprint or explicit absence, fixture identity, governing Version Set, and
   export-policy version. It carries its own `sha256:` Content Identity.
2. The export contains only safe, scoped evidence needed to review the proof:
   fixture provenance; Blueprint and provisioning references; runtime Records
   and lifecycle states; Business Events; Evidence references; Stock Movements;
   Ledger Entries and Posting Sets; Payments; derived stock, cash, and ledger
   reconciliations; accepted and rejected Kernel Command Result references; and
   invariant and reset results.
3. Values are minimized and redacted according to Sensitive Data Class. Raw
   model prompts, agent reasoning, operational traces, credentials, secrets,
   provider payloads, machine-local paths, and data from another Tenant,
   target, Location, or generation are excluded.
4. Export is read-only review evidence. It is not a backup, import format,
   restore point, migration package, audit opinion, owner acceptance, Blueprint
   Approval, Kernel Evidence for a new action, or authority to provision,
   reset, deploy, or create business truth. Import and restore are unsupported
   in v1.

### Executable isolation proof

The later Reference Vertical Slice acceptance contract must require observable
checks that:

- every positive business effect resolves the expected Tenant, target,
  Location, active generation, Applied Blueprint, Role, and causation;
- a cross-Tenant command using the isolation sentinel is rejected with zero
  effects and without leaking sentinel data;
- cross-target, cross-Location, stale-generation, stale-Applied-Blueprint, and
  out-of-scope Role commands and reads are rejected with zero effects;
- retail state never appears in cafe reads or exports, and cafe state never
  appears in retail reads or exports;
- independently recomputed stock, cash, and ledger results use only the active
  target generation;
- each target export is deterministic, scoped, redacted, and content-identified;
  and
- the authorized reset replaces both generations, makes all prior-generation
  runtime truth inaccessible, preserves governance history, and reaches the
  declared zero clean-unapplied state.

These checks validate the Reference Vertical Slice's logical boundary only.
They are not evidence of production authentication, encryption, database row
security, network isolation, backup safety, regulatory compliance, scaling, or
operational hardening, all of which remain out of scope.
