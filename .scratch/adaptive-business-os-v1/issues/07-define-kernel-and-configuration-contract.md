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

#### Governed Configuration variation-surface contract

Use closed, typed, versioned Configuration Points as the only way a Business
Blueprint may vary supported behavior or experience. A Configuration Point
must be declared by the canonical Blueprint Configuration Schema or by the
exact version of an enabled Capability; anything not expressly declared is not
configurable.

Every Configuration Point must declare its stable identity and schema path;
owning schema and version; value kind; allowed values, range, precision,
length, or reference targets; required or optional status; collection and
ordering semantics; whether absence means disabled or Not Applicable;
permitted effect category; validation and cross-reference rules; Sensitive Data
Class and retention requirements when relevant; and the Intent Traceability
required for owner review. A Configuration Point may narrow or parameterize
declared Kernel behavior but may never create a new governed action or
executable semantic.

Governed Configuration may express only these seven variation families:

1. **Business scope and Capability composition:** supported business kinds,
   countries, Locations and scopes, languages, time zones, currencies,
   normalized units, tax or fiscal profile references, size or tier selection,
   explicit exclusions, enabled v1 Capabilities, exact supported versions, and
   schema-declared settings. It may not weaken the Kernel Foundation or omit a
   required Capability dependency.
2. **Record configuration:** select declared Record types; enable or disable
   schema-declared optional fields; instantiate only schema-declared
   supplemental-field slots; bind allowed relationships; and choose declared
   requiredness, literal defaults, enumerations, ranges, lengths, precision,
   and validation profiles. Supplemental fields are limited to declared
   scalar, enumeration, date or time, money, quantity, and stable-reference
   kinds; each needs a stable identity, Sensitive Data Class, retention
   profile, and intent source. They are informational unless an enabled
   Capability explicitly declares a Configuration Point that consumes them.
   Configuration may not change Kernel-owned identity, tenancy, causation,
   lifecycle, immutability, attribution, or audit fields; redefine a Record;
   introduce an arbitrary Record type; or attach executable computation.
3. **Workflow configuration:** select a declared Workflow template and exact
   version; enable declared optional states and transitions; arrange only
   declared paths; bind declared governed actions, Roles, Evidence
   requirements, exception and cancellation paths; and parameterize guards
   using only a Capability-declared predicate vocabulary over declared fields
   and typed values. Guard configuration may use only bounded presence,
   equality, membership, and numeric or temporal comparison forms explicitly
   allowed by the schema. It may not introduce states, transitions, actions,
   loops, expressions, side effects, network calls, runtime prompts, or
   scripts; remove a mandatory invariant or correction path; or make
   presentation order into Workflow truth.
4. **Role and Evidence configuration:** create named Blueprint Roles from
   declared responsibility and governed-action references; restrict their
   Location or Record scope; bind Workflow participation, Evidence duties,
   approval responsibilities, reviewer roles, timing, retention, and declared
   separation-of-duty profiles. Configuration may restrict authority but may
   not grant an action the enabled Capability does not expose, implement
   authorization, waive a Kernel-required Evidence duty, let one Role violate
   mandatory separation of duty, or contain participant assignments or
   Evidence instances.
5. **Policy Profile configuration:** select only declared sales, purchasing,
   Payment, cash, accounting, inventory, data-handling, and external-AI
   profiles and their typed parameters within fixed bounds. Numeric thresholds
   and owner policy values must be Confirmed and source-attributed; fixed Kernel
   invariants are not Configuration Points. A profile may choose among
   implemented behaviors but may not contain formulas, posting maps, stock
   arithmetic, tax code, authorization logic, migration instructions, or
   executable expressions.
6. **Experience configuration:** arrange Role-specific navigation, declared
   forms and controls, field grouping and order, presentation-only visibility
   or enabled state, labels, help text, localized copy, branding tokens, report
   and dashboard selections, declared filters, dimensions, measures and
   aggregations, device needs, and supported offline behavior. Every reference
   must resolve to enabled Capability content. Free text and localized copy are
   never parsed as execution instructions; visibility never grants or removes
   authority; required business Evidence and owner-review information may not
   be hidden; and reports may not contain arbitrary queries, SQL, formulas, or
   new business truth.
7. **Data-handling and integration configuration:** select supported Sensitive
   Data Class handling, retention, minimization, redaction, external-AI
   exposure, and adapter profiles; then bind only declared adapter identity and
   version, direction, Business Event or data scope, mapping template, trigger
   or schedule, Location or Role scope, and credential reference identity.
   Configuration may become more restrictive but may not downgrade a Sensitive
   Data Class or safety boundary. It contains no credentials, secrets,
   arbitrary endpoints, custom mappings with executable semantics, adapter
   code, or external production authority; Reference Vertical Slice adapters
   may remain simulated or absent.

Configuration values may be only schema-declared booleans, enumerations,
bounded integers or fixed-precision decimals, normalized dates and times,
bounded text, localized text maps, stable identity references, closed objects
and collections, or fixed templates with typed parameters. When order matters,
an explicit order field carries that meaning. User-authored regular
expressions, general expression languages, code, SQL, templates with execution
semantics, file paths, shell commands, arbitrary URLs, runtime prompts, and
opaque provider payloads are forbidden.

Every material value and every owner-visible default must be explicit in the
complete Blueprint and traced to Confirmed intent or a fixed Kernel invariant.
An optional omission has meaning only when its schema explicitly defines that
meaning; otherwise it is invalid. Unknown, Ambiguous, Conflicting, Assumed, or
Unsupported intent may remain only in deferred alternatives, exclusions, or
unsupported review material and may not drive configuration eligible for
approval. AI may propose a value but may not invent it, silently default it,
convert free text into executable meaning, or mark it owner-confirmed.

The retail and cafe Blueprints may differ in enabled Capabilities, declared
fields, Workflow arrangements, Roles, Evidence duties, Policy Profile
selections, interfaces, reports, dashboards, copy, and localization. Their
eight shared Capability versions must retain identical governed-action
semantics and invariants; configuration may tailor the experience and select
declared policy variants but may not fork shared behavior.

Every accepted configuration change belongs to the immutable Blueprint
content, changes Blueprint Content Identity when canonical content changes,
appears in the Semantic Diff, and requires the normal validation, Approval
Eligibility, explicit Blueprint Approval, compatibility, and provisioning
path. No Configuration Point grants authority by itself.

This contract defines the permitted Governed Configuration surface only. Exact
Configuration Schema diagnostic categories and codes, the compiled execution
artifact, Capability machine identifiers and exact version numbers,
compatibility rules, and the financial, stock, and audit policy values remain
later decisions.

Governed Configuration is the complete, schema-constrained set of
Blueprint-declared selections and parameters that tailors supported
Capabilities, Records, Workflows, Roles, Evidence, policies, and experience for
one Tenant without defining executable business logic or granting execution
authority.

A Configuration Point is a named, versioned, schema-declared place where a
Business Blueprint may select or parameterize one bounded aspect of Governed
Configuration without defining executable behavior.

Avoid using customization hook, code extension, formula, prompt instruction,
arbitrary setting, or runtime rule as synonyms for Configuration Point.
