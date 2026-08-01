# Define the Business Kernel and Governed Configuration contract

Type: grilling  
Status: resolved
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

#### Configuration validation, rejection, and diagnostic contract

Use deterministic, layered, fail-closed validation with a closed verdict model
and stable project-owned diagnostic codes. Configuration Schemas declare
structural constraints and Configuration Points; the Business Kernel applies
the same canonical, reference, semantic, policy, safety, traceability, and
authority validators for preview, Approval Eligibility recheck, compilation,
and provisioning preparation. No layer may prune, repair, coerce, default,
reinterpret, or waive invalid configuration.

A Configuration Validation Report is an externally recorded, immutable review
artifact. It must bind the exact Blueprint Reference and Blueprint Content
Identity when independently recomputable; otherwise it must bind a
non-authoritative fingerprint of the exact received candidate and state why no
approval-eligible Content Identity exists. It also binds the exact canonical
Blueprint Configuration Schema, selected Capability and Configuration Schema
versions, canonicalization rules, validator-policy version, and
validation-engine version; records the validation time and responsible Kernel
source; contains the complete safe-to-report diagnostics; and records one
Configuration Validation Verdict. It is not Blueprint content, Blueprint
Lifecycle State, Approval Eligibility, a Compatibility Verdict, Blueprint
Approval, provisioning authority, or runtime state.

Validation proceeds in deterministic layers: artifact parsing and
canonical-content checks; closed structural schema checks; identity and
cross-reference checks; Capability composition and Configuration Point checks;
Workflow and governance checks; Policy Profile and invariant checks;
experience and integration checks; sensitive-data, safety, and Intent
Traceability checks; and authority-boundary checks. Validators run as far as
safely possible to return a useful complete set, but no partial run may yield a
permissive verdict.

Exactly one of four Configuration Validation Verdicts applies:

1. **Valid:** every required validator completed against the bound version set
   and produced no diagnostic.
2. **Valid With Advisories:** every required validator completed, no Blocking
   diagnostic exists, and at least one permitted Advisory exists.
3. **Invalid:** every validator needed to decide validity completed
   sufficiently and at least one Blocking diagnostic proves the candidate
   violates a declared contract.
4. **Indeterminate:** validity cannot be completely established because a
   required schema, rule set, validator, mapping, bound version, or input is
   missing, stale, failed, inconsistent, or non-deterministic. It fails closed
   and may never be guessed into another verdict.

Indeterminate takes precedence whenever validation completeness is unknown;
otherwise Invalid takes precedence over Valid With Advisories, which takes
precedence over Valid. Invalid and Indeterminate block Approval Eligibility.
Valid and Valid With Advisories satisfy only the static-validation prerequisite
and grant no approval or provisioning authority.

Every Configuration Diagnostic must contain a stable code, fixed category and
severity, validation layer, exact schema path using the canonical path
convention, affected stable object identity when available, safe owner-facing
summary, technical explanation, remediation category, related paths and
identities, relevant Intent Brief statement and Acceptance Condition
references, and the exact bound validator version set. Diagnostic text and
localization may improve without changing meaning, but consumers rely on code,
severity, paths, identities, and bound versions rather than message wording or
ordering. Diagnostics must never expose credentials, secrets, Restricted
values, or unnecessary Confidential data.

Codes use the exact uppercase three-part form `CFG.<FAMILY>.<REASON>`. Code
meaning and Blocking or Advisory severity are immutable within one
validator-policy version. Adding a code, removing a code, or changing its
meaning or severity requires a new validator-policy version and invalidates
review freshness. The closed v1 Blocking code catalog is:

- **CFG.ARTIFACT:** `PARSE_FAILED`, `DUPLICATE_KEY`,
  `UNSUPPORTED_SERIALIZATION`, `CANONICALIZATION_FAILED`,
  `CONTENT_IDENTITY_MISMATCH`.
- **CFG.SCHEMA:** `UNSUPPORTED_VERSION`, `REQUIRED_MISSING`,
  `UNKNOWN_PROPERTY`, `TYPE_MISMATCH`, `VALUE_NOT_ALLOWED`,
  `RANGE_VIOLATION`, `PRECISION_VIOLATION`, `DATE_TIME_AMBIGUOUS`,
  `NON_FINITE_NUMBER`, `ORDER_INVALID`, `COMMENT_FORBIDDEN`.
- **CFG.IDENTITY:** `INVALID`, `DUPLICATE`, `TENANT_MISMATCH`,
  `LINEAGE_MISMATCH`, `IMMUTABLE_MISMATCH`.
- **CFG.REFERENCE:** `UNRESOLVED`, `WRONG_KIND`, `CROSS_TENANT`,
  `DISABLED_OWNER`.
- **CFG.CAPABILITY:** `UNKNOWN`, `VERSION_UNSUPPORTED`,
  `DEPENDENCY_MISSING`, `DEPENDENCY_CONFLICT`, `FOUNDATION_OVERRIDE`,
  `COMPOSITION_FORBIDDEN`.
- **CFG.POINT:** `UNDECLARED`, `VALUE_KIND_FORBIDDEN`,
  `ABSENCE_UNDEFINED`, `DEFAULT_UNTRACED`, `KERNEL_FIELD_OVERRIDE`,
  `EXECUTABLE_CONTENT`.
- **CFG.WORKFLOW:** `TEMPLATE_UNSUPPORTED`, `STATE_UNDECLARED`,
  `TRANSITION_ILLEGAL`, `ACTION_UNDECLARED`, `GUARD_UNSUPPORTED`,
  `REFERENCE_INVALID`, `REQUIRED_PATH_MISSING`, `STATE_UNREACHABLE`,
  `CORRECTION_PATH_REMOVED`.
- **CFG.GOVERNANCE:** `ACTION_OUT_OF_SCOPE`, `ROLE_SCOPE_INVALID`,
  `SEPARATION_VIOLATION`, `EVIDENCE_REQUIRED`, `REVIEWER_INVALID`,
  `AUTHORITY_BY_PRESENTATION`.
- **CFG.POLICY:** `PROFILE_UNSUPPORTED`, `PARAMETER_INVALID`,
  `INVARIANT_OVERRIDE`, `FORMULA_FORBIDDEN`, `NONCONFIRMED_VALUE`.
- **CFG.EXPERIENCE:** `REFERENCE_UNRESOLVED`, `CONTROL_UNSUPPORTED`,
  `REQUIRED_CONTENT_HIDDEN`, `QUERY_FORBIDDEN`, `OFFLINE_UNSUPPORTED`,
  `PRESENTATION_AS_TRUTH`.
- **CFG.INTEGRATION:** `ADAPTER_UNSUPPORTED`, `VERSION_UNSUPPORTED`,
  `SCOPE_FORBIDDEN`, `ENDPOINT_FORBIDDEN`, `MAPPING_FORBIDDEN`,
  `CREDENTIAL_EMBEDDED`, `PRODUCTION_AUTHORITY_FORBIDDEN`.
- **CFG.SAFETY:** `CLASSIFICATION_MISSING`, `CLASSIFICATION_DOWNGRADE`,
  `RETENTION_UNSUPPORTED`, `JURISDICTION_UNSUPPORTED`,
  `EXTERNAL_AI_FORBIDDEN`, `SECRET_PRESENT`, `HANDLING_INDETERMINATE`.
- **CFG.TRACEABILITY:** `SOURCE_MISSING`, `INTENT_STATE_MISSING`,
  `NONCONFIRMED_ACTIVE`, `ASSUMPTION_ACTIVE`, `UNSUPPORTED_ACTIVE`,
  `REQUIRED_ACCEPTANCE_UNMAPPED`, `EXCLUSION_MISSING`.
- **CFG.AUTHORITY:** `CODE_FORBIDDEN`, `AUTHORIZATION_LOGIC_FORBIDDEN`,
  `LEDGER_LOGIC_FORBIDDEN`, `STOCK_LOGIC_FORBIDDEN`,
  `APPROVAL_LOGIC_FORBIDDEN`, `MIGRATION_FORBIDDEN`,
  `RESET_LOGIC_FORBIDDEN`, `DEPLOYMENT_FORBIDDEN`,
  `RUNTIME_PROMPT_FORBIDDEN`.
- **CFG.VALIDATOR:** `RULESET_MISSING`, `EXECUTION_FAILED`, `RESULT_STALE`,
  `NONDETERMINISTIC_RESULT`, `VERSION_MISMATCH`, `UNCLASSIFIED_FINDING`.

`CFG.VALIDATOR` findings yield Indeterminate rather than Invalid because the
system failed to establish candidate validity. Every other cataloged code is
Blocking except these four exact Advisory codes:
`CFG.ADVISORY.DESIRED_ACCEPTANCE_DEFERRED`,
`CFG.ADVISORY.DESIRED_EXCLUSION`,
`CFG.ADVISORY.SUPPORTED_DEPRECATION`, and
`CFG.ADVISORY.PRESENTATION_FALLBACK`. An Advisory is permitted only when the
candidate remains fully safe and semantically complete for every Required
Acceptance Condition and Kernel invariant. Unknown properties, unsupported
versions, unresolved references, non-Confirmed active values, safety or
jurisdiction uncertainty, authority-boundary attempts, required-path gaps, and
validator failures can never be Advisories.

A Blocking diagnostic cannot be acknowledged, suppressed, waived, or
downgraded by the owner, AI, interface, Blueprint, Capability, adapter, or
provisioning request. Resolution requires an attributable Intent Brief or
Blueprint change producing a new immutable Draft as applicable, or a versioned
Kernel, Capability, schema, or validator-policy change followed by complete
revalidation. Advisory acknowledgement may be recorded in the review bundle
but does not alter the diagnostic, candidate, verdict, or lifecycle.

For identical candidate content and identical bound schema, Capability,
canonicalization, and validator-policy versions, validation must produce the
same verdict and the same set of code, severity, path, and object-identity
tuples. Results are sorted deterministically by validation layer, code, path,
and object identity. Duplicate findings with the same tuple collapse into one
diagnostic while preserving related causes. Any unexplained difference is
`CFG.VALIDATOR.NONDETERMINISTIC_RESULT` and yields Indeterminate.

A changed Blueprint candidate, Blueprint Content Identity, governing schema,
selected Capability version, validator policy, canonicalization rule, or
required validation input makes the prior report stale. Validation failure
never changes Blueprint Lifecycle State, rejects the owner intent, mutates the
Draft, authorizes repair, or proves runtime scenario failure. Static validity
cannot prove financial, stock, workflow, reset, or Reference Vertical Slice
acceptance; those remain separately executable evidence.

This contract fixes validation layers, rejection behavior, report binding,
verdicts, diagnostic fields, stable code format, the closed v1 code catalog,
severity, determinism, redaction, and staleness. It does not yet define the
compiled execution artifact, Capability machine identifiers and exact
versions, version compatibility rules, provisioning diagnostics, or the later
financial, stock, and audit invariant values.

A Configuration Schema is a versioned, closed contract that declares
Configuration Points, allowed structures, values, references, and
deterministic rejection rules for Governed Configuration.

A Configuration Diagnostic is a deterministic, owner-reviewable finding bound
to one exact Blueprint candidate and validator version set, identified by a
stable code and path and describing either a blocking contract violation or a
permitted non-blocking advisory without granting authority.

A Configuration Validation Verdict is the deterministic result—Valid, Valid
With Advisories, Invalid, or Indeterminate—of validating one exact Blueprint
candidate under one exact schema and validator version set; it is not Approval
Eligibility, a Compatibility Verdict, Blueprint Approval, provisioning
readiness, or acceptance.

Avoid using error message, warning text, lint result, AI critique, approval
denial, or test result as synonyms for Configuration Diagnostic.

#### Effective Blueprint compilation-artifact contract

Use one deterministic, immutable, self-contained, target-neutral Effective
Blueprint compiled from one exact validated Blueprint candidate and an exact
Business Kernel, Configuration Schema, Capability, validator, and compiler
version set.

The same compilation path may produce a non-authoritative Draft preview, while
provisioning may rely only on an artifact whose exact source Blueprint is
Approved and unchanged. The artifact is derived, independently recomputable,
content-identified, side-effect-free, and never grants approval or execution
authority by itself.

It resolves only declared Capability dependencies, Record and Workflow
contracts, Role and Evidence bindings, typed Policy Profile selections,
experience manifests, supported adapter bindings, invariant references, and
Intent Traceability. It excludes approval truth, credentials, arbitrary tenant
code, target compatibility and provisioning state, runtime business truth,
migrations, resets, deployments, fixtures, and test results.

This contract fixes only the compiled execution-artifact boundary. Capability
and Configuration Schema machine identities, exact versions, version
compatibility rules, and provisioning diagnostics remain later decisions.

An Effective Blueprint is a deterministic, immutable, self-contained,
target-neutral resolution of one exact validated Blueprint candidate under one
exact governing version set, containing only declared configuration for
Business Kernel preview or provisioning. It is derived material, not Blueprint
Approval, execution authority, target state, runtime truth, tenant code, or a
deployment.

Avoid using Business Blueprint, generated app, deployment package, target
bundle, runtime snapshot, or approval token as synonyms.

#### Machine identity, exact-version, and compatibility contract

Use stable, project-owned, lower-case machine identities that never change or
transfer, exact independently versioned SemVer releases bound to immutable
provenance and content identity, and an explicit Business Kernel-owned
Compatibility Registry. Start each independently governed v1 contract at
`1.0.0`.

Every Blueprint, Effective Blueprint, Configuration Validation Report,
compatibility artifact, and Provisioning Request must pin the exact identities
and versions it uses; ranges, wildcards, aliases, and `latest` selectors are
forbidden. SemVer communicates intended change only and never grants
compatibility.

Compatibility must be declared directionally for exact source and target
Version Sets with any required schema comparison mapping; absence, staleness,
mismatch, or non-comparability fails closed. Every bound-version change
requires revalidation and recompilation.

A changed Blueprint selection or changed owner-reviewed effective meaning
requires a new Draft and explicit Blueprint Approval. Migration Required
remains unsupported in v1. Retail and cafe must pin the same exact Machine
Identities and versions for their shared Capabilities.

A Machine Identity is a stable, project-owned, lower-case identifier that names
one independently versioned Business Kernel contract across releases and is
never changed, transferred, or reused.

A Version Set is an immutable collection of exact Machine Identity and SemVer
release bindings, together with their provenance and content identities, that
identifies the governing contracts for one Blueprint-related artifact or
request.

A Compatibility Registry is the Business Kernel-owned, versioned collection of
directional compatibility declarations and schema comparison mappings between
exact Version Sets. It grants no compatibility when a required declaration is
absent, stale, mismatched, or non-comparable.

Avoid using display label, alias, package name, version, or latest selector as
synonyms for Machine Identity. Avoid using SemVer rule, package resolver,
migration plan, Compatibility Verdict, or latest-version policy as synonyms
for Compatibility Registry.
