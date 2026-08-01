# Define the Business Kernel and Governed Configuration contract

Type: grilling  
Status: claimed
Blocked by: 01, 02, 06

## Question

Which v1 behaviors are stable Business Kernel capabilities, which variations
may Governed Configuration express, and what must Configuration Schemas reject?

## Answer

### Accepted decisions

#### Business Kernel authority-boundary contract

Use a deterministic, versioned Business Kernel as the sole executor of
governed business truth. Governed Configuration selects and constrains declared
behavior; it never supplies executable business logic.

1. The Business Kernel owns Tenant isolation and exact Tenant and Location
   scoping; identity and reference resolution; closed-schema validation and
   canonicalization; Blueprint Content Identity verification; and Blueprint
   lifecycle, Approval Eligibility, concurrency, Compatibility Verdict,
   provisioning, Applied Blueprint, Blueprint Reversion, and Sandbox Reset
   enforcement.
2. The Business Kernel owns governed-action validation and dispatch; Role
   authorization enforcement and separation of duty; Workflow transition
   enforcement; Evidence requirement checks; idempotency, causation,
   attributable source, effective time, and recorded time; and Business Event
   creation.
3. The Business Kernel owns durable Record lifecycle integrity and cross-Record
   invariants. No interface, AI provider, adapter, or configured Workflow may
   directly mutate governed state.
4. The Business Kernel owns accounting and inventory algorithms and
   invariants, including immutable balanced Ledger Entries, Stock Movement
   arithmetic, normalized units, currencies, and precision, allocations,
   atomicity, and compensating corrections. A Blueprint may select declared
   Policy Profiles, but may not encode formulas, posting logic, or stock
   arithmetic.
5. The Business Kernel owns the supported Capability and Configuration Schema
   registries, governed-action vocabulary, Policy Profiles, comparison
   mappings, compatibility rules, and adapter contracts, with exact supported
   versions.
6. The Business Kernel compiles each exact Approved Blueprint into a separate,
   target-validatable execution artifact without expanding the authority
   granted by that Blueprint or the Kernel. The exact artifact model remains a
   later decision.
7. Governed Configuration may only select and parameterize declared schema
   elements: enabled Capabilities; supported Record fields and relationships;
   allowed Workflow arrangements; Role definitions and scopes referencing
   governed actions; Evidence requirements; Policy Profile parameters;
   Experience Configuration; reports and dashboards; localization; and
   supported integration adapters.
8. AI may propose only that Governed Configuration. Owner approval binds the
   exact Blueprint; neither AI output nor configuration can create new Kernel
   behavior, authorization, accounting, inventory, approval, migration, reset,
   or deployment authority.
9. The Kernel fails closed on unknown or unsupported properties, identifiers,
   references, versions, fields, states, transitions, governed actions,
   formulas, scripts, endpoints, authorization rules, ledger mappings, stock
   arithmetic, migrations, or deployment instructions. It may not ignore,
   prune, repair, infer, or coerce them into executable meaning.
10. Business Kernel behavior changes only through a versioned platform or
    Capability release with declared schemas, validation, tests, and
    compatibility metadata, not through a Tenant Blueprint. Declared adapters
    and Capability contracts are the only extension seams; arbitrary tenant
    runtime code is forbidden.

This contract defines the authority boundary only. The exact v1 Capability
inventory, configuration surface, schema rejection taxonomy, compilation
artifact, and version compatibility rules remain later questions in this
ticket.

A Business Kernel is a versioned, deterministic platform authority that
validates, compiles, authorizes, and executes supported business behavior for
every Tenant while enforcing isolation, Record and Workflow integrity,
Evidence duties, accounting, stock, approval, provisioning, and reset truth.
It is configured by an Approved Blueprint but never replaced or extended by
tenant-specific runtime code.

Avoid using ERP core, shared library, generated backend, tenant runtime, plugin
host, or AI agent as synonyms.
