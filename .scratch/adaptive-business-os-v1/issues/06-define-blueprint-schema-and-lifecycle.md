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

This ticket remains claimed until the remaining Business Blueprint schema and
lifecycle decisions are resolved.
