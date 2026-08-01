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

#### v1 Capability inventory and composition contract

Use one closed v1 inventory of eleven versioned Capabilities plus an
always-active Kernel Foundation. Each Blueprint must name every enabled
Capability and its exact supported version; v1 has no catch-all custom
Capability, Retail Capability, Cafe application Capability, or tenant-specific
executable extension.

The Kernel Foundation is always active and is not a selectable Capability. It
owns Tenant and Location isolation; Blueprint validation, lifecycle, approval,
compatibility, provisioning, Applied state, reversion, and reset; Record
lifecycle integrity; Workflow, Role, and Evidence enforcement; Business Event
causation, idempotency, attribution, and audit; and the Capability and
Configuration Schema registries. No Blueprint may disable, replace, or
parameterize away these foundations.

The closed v1 selectable Capability inventory is:

1. **Party Registry:** customer, supplier, and transaction-counterparty
   identity and relationships needed by governed business activity. It does not
   define login accounts, Roles, or authorization.
2. **Catalog:** purchased and saleable goods, ingredients, Menu Items,
   Modifiers, normalized units, owner-reviewed prices, and allowed choices
   within declared schemas.
3. **Purchasing:** Purchase Order intent and its governed lifecycle, including
   cancellation, without implying receipt, stock, Payment, or ledger truth.
4. **Receiving:** attributable supplier receipt and acceptance states,
   quantities, and Evidence, invoking Inventory admission only through
   declared governed actions; receipt is never inferred from a Purchase Order.
5. **Inventory:** immutable Stock Movements, Location and explicit-boundary
   scoping, independently recomputable on-hand quantities, normalized units,
   consumption, and compensating correction actions. The Kernel owns all
   arithmetic.
6. **Ordering:** accepted customer request lifecycle, specified goods or
   services, quantities, price snapshots, and allowed choices, without
   conflating an Order with Sale, Payment, Kitchen Ticket, or stock truth.
7. **Sales:** governed commercial fulfillment or cancellation and its causal
   Business Events, linking Order fulfillment to declared inventory and
   accounting effects without becoming a Payment or Ledger Entry.
8. **Payment:** governed monetary-transfer Records, direction, method,
   effective time, allocation, and compensating correction, while the Kernel
   owns all resulting accounting effects.
9. **Cash:** governed cash receipt and control actions plus an independently
   recomputable cash position derived from accepted Payments and Business
   Events. Exact drawer, shift, and close policies remain outside this
   inventory decision.
10. **Ledger:** ledger accounts, immutable balanced Ledger Entries, posting
    sets, reversal, and reconciliation interfaces; exact posting and costing
    policies remain owned by the later financial, stock, and audit invariants
    decision.
11. **Kitchen Operations:** Menu Item and Modifier preparation context, simple
    schema-declared ingredient requirements, and Kitchen Ticket progression
    through accepted, preparing, ready, and fulfilled. It may request
    ingredient consumption through Inventory but never mutates stock directly.

The retail Sandbox Blueprint must enable Party Registry, Catalog, Purchasing,
Receiving, Inventory, Ordering, Sales, Payment, Cash, and Ledger. It proves
Purchase Order, receipt, stock admission, Order and Sale, Payment, cash, and
balanced-ledger reuse without a Retail Capability.

The cafe Sandbox Blueprint must enable Party Registry, Catalog, Inventory,
Ordering, Sales, Payment, Cash, Ledger, and Kitchen Operations. It must use the
same exact shared Capability versions as retail for Party Registry, Catalog,
Inventory, Ordering, Sales, Payment, Cash, and Ledger. Kitchen Operations
supplies only the cafe-specific kitchen progression and ingredient-consumption
request; tables, reservations, delivery, tips, loyalty, and advanced recipe
costing remain excluded.

Minimum activation dependencies are declared and fail closed: Purchasing
requires Party Registry and Catalog; Receiving requires Purchasing and
Inventory; Inventory and Ordering require Catalog; Sales requires Ordering;
Cash requires Payment; Kitchen Operations requires Catalog, Ordering, and
Inventory; and Ledger is mandatory wherever the enabled v1 path may create
accounting effects. A disabled or missing dependency contributes no Records,
Workflows, governed actions, interfaces, or execution authority.

Retail and cafe are Blueprint compositions and experience profiles, not
Capabilities or vertical applications. Forms, layouts, reports, dashboards,
localization, and Role-specific navigation remain Governed Configuration over
enabled Capabilities, not additional business Capabilities.

This contract fixes only the v1 Capability inventory, responsibility
boundaries, activation dependencies, and retail/cafe composition. Exact Record
fields, governed-action inputs and outputs, Workflow guards, Evidence rules,
Policy Profile values, tier entitlements, machine identifier format, exact
version numbers, compatibility rules, compilation artifact, and rejection
diagnostics remain later decisions.

A Kernel Foundation is the always-active, non-selectable part of the Business
Kernel that preserves governance and execution invariants for every Tenant and
cannot be disabled, replaced, or weakened by a Business Blueprint.

Avoid using core Capability, hidden Capability, base module, system feature, or
tenant default as synonyms.
