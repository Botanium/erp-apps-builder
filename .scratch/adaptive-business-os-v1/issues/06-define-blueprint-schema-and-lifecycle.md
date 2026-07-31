# Define the Business Blueprint schema and lifecycle

Type: grilling  
Status: claimed
Blocked by: 01, 05

## Question

What belongs in the v1 Business Blueprint, how are versions identified and
compared, and which state transitions govern Draft Blueprint, Blueprint
Approval, Approved Blueprint, rejection, supersession, and reset?

## Answer

### Accepted decisions

#### Blueprint Version representation contract

Each Blueprint Version must be a complete, immutable, self-contained snapshot
of the Business Blueprint's proposed Governed Configuration at one point in its
lineage. It must contain or reference everything the Business Kernel needs to
validate that version without replaying earlier versions or patches.

Editing never changes an existing Blueprint Version; it creates a new Draft
Blueprint version. A parent-version reference may preserve lineage, but it does
not make the new version dependent on its parent for meaning. A semantic diff
is derived by comparing two normalized complete snapshots; it is review
material, not a Business Blueprint or execution authority.

Blueprint Approval binds to exactly one unchanged Blueprint Version. This
representation decision does not yet choose the identifier format, exact
schema sections, approval eligibility rules, lifecycle transitions,
compatibility policy, or reset behavior; those remain later questions in this
ticket.

A Blueprint Version is an immutable, self-contained snapshot of a Business
Blueprint's proposed Governed Configuration at one point in its lineage,
independently validatable without replaying earlier versions. It is not a
patch, mutable draft file, current runtime state, deployment, or approval.

#### Business Blueprint authority-boundary contract

A Blueprint Version is authoritative only for the Tenant's proposed Governed
Configuration and the traceability needed to review that proposal.

It must contain:

1. An immutable envelope identifying its Blueprint lineage, Version, Tenant,
   parent Version when present, governing Configuration Schema version, source
   Intent Brief version or versions, and creation provenance. The identifier
   format remains a later decision.
2. The complete desired Governed Configuration expressed only through declared
   Configuration Schemas, including supported selections and settings for
   business scope, Locations, Capabilities, Records, Workflows, Roles, Evidence
   rules, business-policy profiles, interfaces, reports, dashboards,
   localization, data handling, and integrations.
3. Source traceability from each material proposal to the relevant Intent Brief
   statements, Acceptance Conditions, Assumptions, constraints, exclusions,
   and Unsupported intent. It carries Evidence requirements and references,
   not runtime Evidence instances.

The Blueprint Version must not contain Blueprint Approval or approval Evidence;
semantic diffs, previews, diagnostics, or validation reports; compiled
artifacts such as an Effective Blueprint, Capability Manifest, or Execution
Graph; migration, rollback, provisioning, or deployment state; runtime Records,
Business Events, Stock Movements, Ledger Entries, balances, or participant
assignments; credentials, secrets, arbitrary code, operational traces, or test
results. Those are separate artifacts or runtime state and must reference the
exact Blueprint Version when related.

The Blueprint declares desired configuration; the Business Kernel validates,
compiles, authorizes, applies, and observes it. Keeping later outcomes outside
means approval or execution never mutates the content that was reviewed. This
decision establishes the authority boundary only; the exact top-level schema
sections and field shapes remain the next question.

#### Canonical Blueprint schema-section contract

Every v1 Blueprint Version must conform to one closed, versioned canonical
schema shared by retail and cafe and must contain these eleven top-level
sections:

1. **Envelope:** Blueprint lineage identity, Version identity, Tenant identity,
   optional parent Version identity, governing Configuration Schema identity
   and version, source Intent Brief version references, and creation
   provenance. The identifier formats remain a later decision.
2. **Business Scope:** supported business kinds, operating countries, Locations
   and their scopes, languages, time zones, currencies, normalized units, tax
   or fiscal profile references, size or tier selection, and explicit scope
   exclusions.
3. **Capability Selections:** each selected Capability's stable identity, exact
   version, Configuration Schema version, enablement, and schema-constrained
   settings.
4. **Record Definitions:** each configured Record type's stable identity,
   declaring Capability, allowed fields and relationships, lifecycle or
   Workflow binding, validation constraints, Sensitive Data Class handling,
   and retention profile references.
5. **Workflow Definitions:** each configured Workflow's stable identity and
   version, governed Records, states, initial and terminal states, transitions,
   governed-action references, Role participation, guards, Evidence
   requirements, and declared exception or cancellation paths.
6. **Role Definitions:** each Role's stable identity, business
   responsibilities, Location or Record scope, permitted governed-action
   references, Workflow participation, Evidence duties, approval
   responsibilities, and declared separation-of-duty constraints. This
   declares intent; the Business Kernel owns authorization enforcement.
7. **Evidence Rules:** reusable Evidence requirement identities and their
   governed claim, action, or transition scope; required fact or artifact kind;
   attributable source; responsible reviewer; timing; and retention profile.
   It contains requirements and references, not Evidence instances.
8. **Policy Profiles:** schema-constrained selections for sales, purchasing,
   Payment, cash, accounting, inventory, data handling, and external-AI
   exposure. They select declared Business Kernel behavior and may not encode
   formulas, scripts, ledger posting, stock arithmetic, or authorization logic.
9. **Experience Configuration:** Role-specific navigation, forms, field
   presentation, layouts, localized copy, reports, dashboards, device needs,
   and supported offline behavior, all referencing declared Records, fields,
   Workflows, Roles, and governed actions. Presentation never grants authority.
10. **Integration Configuration:** supported adapter identity and version,
    direction, data or Business Event scope, trigger or schedule, Location or
    Role scope, and credential reference identifier only. It contains no
    credentials or arbitrary endpoints outside declared schemas.
11. **Intent Traceability:** a mapping from every material configured item to
    its source Intent Brief statements and relevant Acceptance Conditions,
    Assumptions, constraints, exclusions, or Unsupported intent, preserving
    Intent State and source references.

All eleven sections are required. A collection may be empty only where its
Configuration Schema permits that result and Intent Traceability records an
owner-accepted Not Applicable decision or explicit exclusion. Objects are
closed by default; unknown top-level or nested properties are rejected rather
than ignored or pruned. Every identifier must be unique in its scope, every
reference must resolve, every selected version must be supported, and every
configured value or governed action must be declared by the governing
Configuration Schemas and enabled Capabilities.

Labels, descriptions, and ordering are presentation metadata and never
identity. Deterministic normalization may standardize representation but may
not change business meaning. This contract fixes the canonical section
boundary and minimum semantic content; identifier construction, canonical
serialization, content identity, semantic-diff rules, lifecycle transitions,
compatibility, and reset remain later decisions.

This ticket remains claimed until the remaining Business Blueprint schema and
lifecycle decisions are resolved.
