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

#### Blueprint identity contract

Use a layered, opaque identity model:

1. Tenant Identity names the ownership and isolation boundary and is always
   part of Blueprint resolution.
2. Blueprint Identity is a stable, opaque identity assigned once to a Blueprint
   lineage within one Tenant. It is never derived from a business name,
   vertical, label, or current configuration and is never reused.
3. Version Identity is a new globally unique, opaque identity assigned once
   whenever an immutable Blueprint Version is created. It never changes or
   transfers, even when another Version has identical content.
4. Version Number is a monotonically increasing positive integer allocated
   within the Blueprint lineage for owner-facing sequence and sorting. It is
   never reused; gaps are allowed; it does not identify ancestry, lifecycle
   state, approval, or content equality.
5. Parent Version Reference is absent for the first Version and otherwise names
   the exact Version from which the new Draft was derived. Multiple-child or
   concurrency policy remains a lifecycle decision.

A Blueprint Reference must contain Tenant Identity, Blueprint Identity, and
Version Identity. Human interfaces may additionally display the Version
Number, but a number, label, timestamp, latest/current selector, lifecycle
state, or future content digest is never sufficient to name an exact Version.

Creation time, creator or source, Configuration Schema version, and source
Intent Brief references remain immutable provenance in the Blueprint Envelope
but are not identity. Creating a new Version always allocates a new Version
Identity and Version Number, including an edit that restores byte-for-byte or
semantically identical prior content. Content identity and semantic equality
remain a separate decision and may not transfer Blueprint Approval between
Version identities.

Blueprint Approval must ultimately bind to one exact Blueprint Reference and
its content identity; this contract defines identity construction only, not
canonical serialization, content digest, semantic comparison, lifecycle
transitions, compatibility, or reset.

#### Blueprint content-identity and semantic-comparison contract

Use a schema-aware canonical-content pipeline for every Blueprint Version.

Canonical Blueprint Content consists of Tenant Identity, Blueprint Identity,
governing Configuration Schema identity and version, source Intent Brief
version references, and the complete Business Scope through Intent
Traceability sections. It excludes Version Identity, Version Number, Parent
Version Reference, creation time, creator or source, and the Content Identity
field itself because those identify or describe the Version occurrence rather
than its reviewed semantic content.

Before Content Identity is calculated, the Business Kernel must:

1. Validate the complete closed schema, supported versions, uniqueness, and
   every cross-reference; invalid content has no Content Identity eligible for
   review or approval.
2. Require every material default or inferred value to be explicit in the
   Blueprint. Canonicalization may not add owner intent, repair meaning, apply
   a new business default, or remove Unsupported content.
3. Normalize values only according to the governing Configuration Schema:
   Unicode text to one declared normalization form; integers and fixed-precision
   decimals to one exact representation; dates, times, currencies, and units
   to their declared normalized forms; and object keys to deterministic order.
4. Reject duplicate keys, non-finite numbers, ambiguous dates or times,
   undeclared precision, comments, unknown properties, and unresolved
   references.
5. Sort collections by stable identity only when the schema declares them
   unordered. When order affects the configured experience or behavior, the
   order must be represented by an explicit schema field and is included in
   canonical content. Labels, descriptions, and localized copy never identify
   domain objects, but they remain owner-reviewed Blueprint content, so
   changing them changes Content Identity.
6. Serialize the result as deterministic UTF-8 canonical JSON with no
   insignificant whitespace or transport-specific formatting.

Blueprint Content Identity is recorded as `sha256:<lowercase hexadecimal
digest>` over that canonical JSON. Its algorithm name is part of the value. The
digest must be independently recomputable; any mismatch invalidates the
artifact. A future digest algorithm requires a new named scheme and may not
silently reinterpret an existing value.

Equal Content Identities mean equal canonical Blueprint content only within the
named Tenant, Blueprint lineage, and Configuration Schema interpretation. They
do not mean equal Version Identity, shared provenance, approval, compatibility,
deployment, or runtime state. Creating a new Version always creates a new
Blueprint Reference even when its Content Identity matches an earlier Version.
Blueprint Approval binds both the exact Blueprint Reference and its Content
Identity and never transfers by digest equality.

A Semantic Diff is a separate, derived review artifact produced by comparing
two validated canonical content trees by stable identity and schema path, not
raw text, labels, or array position. It must group changes by the eleven
Blueprint sections; distinguish added, removed, changed, and explicitly
reordered configuration; show old and new owner-reviewable values; preserve
affected Intent Traceability, Acceptance Conditions, Assumptions, constraints,
and Unsupported items; and flag unresolved or non-comparable paths without
inventing an impact. Serialization-only differences produce no Semantic Diff.

If Configuration Schema versions differ, the Semantic Diff must show that
change first and use only a declared comparison mapping. Without one, affected
paths are marked non-comparable rather than guessed. An empty Semantic Diff or
equal Content Identity is review information only, not Blueprint Approval or
permission to provision. This contract does not yet decide lifecycle
transitions, approval eligibility, compatibility verdicts, concurrency,
supersession, or reset.

#### Blueprint Lifecycle State contract

Use five externally recorded Blueprint Lifecycle States. The state belongs to
an attributable lifecycle record bound to the exact Blueprint Reference and
Blueprint Content Identity; it is not stored inside or allowed to mutate the
immutable Blueprint Version.

1. **Draft:** the initial state of every newly created Blueprint Version. It is
   owner-reviewable but has no authority to provision or update a Sandbox
   Experience.
2. **Approved:** the exact Draft Blueprint has received an explicit Blueprint
   Approval and is the lineage's current approved target. Approval authorizes
   eligibility for governed provisioning; it does not mean validation,
   compatibility, provisioning, or application succeeded.
3. **Rejected:** the owner explicitly declined the exact Draft Blueprint. It
   has no execution authority and is terminal.
4. **Superseded:** a previously Approved Blueprint ceased to be the lineage's
   current approved target because a later Version became Approved. Its
   historical Blueprint Approval remains attributable, but it is no longer the
   default authority for new provisioning and is terminal.
5. **Withdrawn:** the owner explicitly ended the current authorization of an
   Approved Blueprint without approving a replacement. Historical approval and
   withdrawal remain attributable, the Version has no further execution
   authority, and the state is terminal.

Allowed transitions are:

- creation -> Draft;
- Draft -> Approved through one explicit Blueprint Approval that binds the
  exact Blueprint Reference and Content Identity;
- Draft -> Rejected through one explicit owner rejection;
- Approved -> Superseded atomically when a later Draft becomes the lineage's
  current Approved Blueprint; and
- Approved -> Withdrawn through an explicit owner withdrawal.

No other in-place transitions are allowed. Rejected, Superseded, and Withdrawn
Versions cannot return to Draft or Approved. Editing, repairing, retrying,
reverting, or adopting content from any Version always creates a new Draft with
a new Blueprint Reference, even when its Content Identity matches historical
content. The source Version and lifecycle state do not change.

Interview completion, preview viewing, option selection, validation success or
failure, equal Content Identity, Semantic Diff review, compatibility checks,
provisioning attempts, applied runtime state, and reset do not by themselves
change Blueprint Lifecycle State. Each allowed transition must preserve the
responsible source, effective time, recorded time, exact prior and resulting
state, reason when supplied, and the governing owner decision.

At most one Version in a Blueprint lineage may be Approved as the current
approved target at a time. A Sandbox Experience may temporarily remain applied
from a Superseded Version until a newer Approved Version is successfully
applied; applied state is separate from lifecycle state. This contract defines
lifecycle states and transitions only; approval eligibility, concurrency
handling, compatibility verdicts, provisioning, rollback, and reset remain
later decisions.

#### Blueprint Approval Eligibility contract

Use a fail-closed Blueprint Approval Eligibility gate. Eligibility is a
deterministic, current verdict over one exact Draft Blueprint and its review
material; it enables the owner to perform Blueprint Approval but is neither
approval nor provisioning authority.

A Draft Blueprint is Approval Eligible only when all of the following are true:

1. **Identity and state:** the exact Blueprint Reference exists in Draft state;
   its Blueprint Content Identity is independently recomputed and matches; and
   its Tenant, Blueprint lineage, Version, parent reference, Configuration
   Schema, Capability versions, and source Intent Brief references are immutable
   and resolvable.
2. **Deterministic validity:** canonical schema, uniqueness, cross-reference,
   Capability-support, Workflow, Role, Evidence-rule, Policy Profile,
   experience-reference, data-handling, and Business Kernel policy validation
   complete with no blocking diagnostic. Unknown fields, unsupported versions,
   digest mismatches, unresolved references, and non-comparable required paths
   block eligibility.
3. **No invented execution truth:** every material value that governs active
   configuration is traced to Confirmed owner intent or a fixed Business Kernel
   invariant. Unknown, Ambiguous, Conflicting, Assumed, or Unsupported intent
   may remain only as visible deferred alternatives, exclusions, or unsupported
   requests that cannot affect the configuration eligible for execution.
4. **Assumptions:** no Assumption may determine an enabled Capability, governed
   action, Role authority, Workflow transition, Evidence duty, Sensitive Data
   Class, external-AI exposure, ledger or stock behavior, migration, or any
   proposal needed by a Required Acceptance Condition. Resolving an Assumption
   requires an attributable Intent Brief update and a new Draft Blueprint;
   Blueprint Approval never confirms it implicitly.
5. **Acceptance coverage:** every Required Acceptance Condition is traced to
   supported Governed Configuration and a declared future Evidence path and is
   neither unsatisfied by design nor marked cannot evaluate. A Desired
   Acceptance Condition may be deferred or excluded only when that disposition
   is explicit, source-attributed, and visible to the owner. Eligibility does
   not claim that any condition has passed; executable acceptance remains owned
   by the Reference Vertical Slice contract.
6. **Safety and exposure:** every named data category has a supported Sensitive
   Data Class and handling path; jurisdiction and retention constraints are
   supported; Restricted data has no external-AI path; and no unresolved safety
   profile remains. Owner preference cannot override a declared safety or
   Business Kernel boundary.
7. **Current review bundle:** the owner can review the normalized Blueprint, its
   exact Blueprint Reference and Content Identity, Semantic Diff from the
   declared baseline, affected Capabilities, Locations, Records, Workflows,
   Roles, Evidence duties, Policy Profiles, interfaces, reports, dashboards,
   integrations, Acceptance Condition coverage, Assumptions, exclusions,
   Unsupported items, validation diagnostics, data-exposure summary, and any
   required compatibility verdict. Every item must reference the same unchanged
   Draft.
8. **Review freshness:** no Blueprint content, governing schema, selected
   Capability version, comparison mapping, validator policy, declared baseline,
   or required compatibility input has changed since the review bundle was
   produced. A material change invalidates eligibility and requires a new or
   recomputed Draft review; it never inherits prior approval.
9. **Explicit owner action:** the approval control must unambiguously say that
   it approves this exact Blueprint Reference and Content Identity. Interview
   completion, preview viewing, option selection, acknowledgement of a warning,
   equal Content Identity, or prior approval of another Version cannot satisfy
   this condition.

At the approval transition, the Business Kernel must atomically recheck
eligibility and record the owner's attributable decision, effective and
recorded time, exact Blueprint Reference, Content Identity, review-bundle
identity, and any explicitly acknowledged non-blocking advisories or Desired
exclusions. A failed or stale recheck leaves the Version in Draft and returns
stable blocker explanations.

Static validation and preview are required for eligibility, but successful
provisioning, runtime scenarios, or Reference Vertical Slice acceptance are not
prerequisites because they occur only after approval authorizes Sandbox
provisioning. This contract defines approval eligibility only; concurrency
policy, compatibility verdict categories, provisioning, rollback, and reset
remain later decisions.

#### Blueprint concurrency contract

Use optimistic, lineage-scoped concurrency with explicit approval baselines and
fail-closed conflicts.

1. Multiple Draft Blueprint Versions may coexist and may share one Parent
   Version Reference. Each remains immutable and independently identified;
   creating or editing one never overwrites, renumbers, deletes, or silently
   merges another.
2. Every Draft review bundle must record an Approval Baseline: the exact current
   Approved Blueprint Reference and Blueprint Content Identity observed when
   the bundle was produced, or explicit absence when the lineage has no current
   Approved Version. The Approval Baseline is external review metadata, not
   Blueprint content, a Parent Version Reference, or a Blueprint Lifecycle
   State.
3. Creating edited content must name the exact source Blueprint Reference and
   Content Identity that was read and must produce a new Draft. A source
   mismatch rejects the request as stale; it never mutates an existing Version
   or guesses which source was intended.
4. Blueprint Approval must atomically recheck Approval Eligibility and compare
   the review bundle's Approval Baseline with the lineage's actual current
   Approved Blueprint Reference and Content Identity. It also verifies the
   unchanged Draft Reference and Content Identity. If any comparison fails, no
   lifecycle or current-approved reference changes.
5. A baseline mismatch makes the review bundle stale, not the Draft Rejected,
   Superseded, Withdrawn, or invalid. The Draft remains in Draft state and
   retains its content and provenance.
6. The system must offer a refreshed schema-aware review against the now-current
   Approved Version, using the common Parent Version when available to
   distinguish parallel additions, removals, changes, explicit reordering, and
   conflicts. Without a declared comparison mapping, affected paths are
   non-comparable and block eligibility rather than being guessed.
7. Neither AI nor an automatic rule may merge or resolve governed or
   traceability meaning. Combining or changing content requires attributable
   owner decisions and a new Draft. If the owner elects to keep the unchanged
   candidate after reviewing every difference against the current Approved
   Version, a newly produced review bundle may establish a new Approval Baseline
   without changing the immutable Draft.
8. Version Numbers are allocated atomically, gaps are allowed, and numeric order
   establishes neither ancestry nor precedence. Parent Version References
   establish ancestry; the externally recorded current Approved Blueprint
   Reference establishes the current approval target.
9. Equal Content Identity may reveal identical canonical content, but it does
   not resolve a race, transfer Blueprint Approval, or replace one Blueprint
   Reference with another.

A concurrency conflict is owner-reviewable information, not a lifecycle state,
owner rejection, or authority to discard work. This contract decides concurrent
Draft and stale-approval handling only; compatibility verdict categories,
provisioning, rollback, and reset remain later decisions.

#### Blueprint Compatibility Verdict contract

Use a closed, fail-closed, target-specific Compatibility Verdict model. A
verdict is a derived, externally recorded review artifact; it is not Blueprint
content, a Blueprint Lifecycle State, Blueprint Approval, provisioning
authority, or runtime state.

Every verdict must bind the exact Blueprint Reference and Content Identity being
evaluated; the exact Tenant and target Sandbox Experience; its exact Applied
Blueprint Reference and Content Identity or explicit absence; the relevant
observed runtime-state facts; and the exact Business Kernel, Configuration
Schema, Capability, adapter, validator-policy, and comparison-mapping versions
used.

Exactly one of six verdicts applies to each target:

1. **Initial Provision Compatible:** the target has no Applied Blueprint or
   retained runtime business state, and the candidate can be provisioned from
   the declared clean boundary.
2. **In-Place Compatible:** declared compatibility rules prove that the target
   can adopt the candidate without reset, migration, destructive rewrite,
   reinterpretation of existing business truth, or invalidation of retained
   Records or Evidence.
3. **Reset Required:** the candidate is valid for a clean target, but existing
   Sandbox state cannot safely be retained; the supported path is a full
   sandbox-only reset followed by reprovisioning. The verdict does not authorize
   or claim that reset.
4. **Migration Required:** retaining the target state would require a data,
   schema, or configuration transformation, backfill, or reinterpretation.
   Migration is unsupported in v1; this verdict is neither a migration plan nor
   permission to perform one.
5. **Incompatible:** declared Business Kernel, Configuration Schema, Capability,
   safety, or target constraints prove that the candidate cannot be supported
   even from the permitted clean boundary.
6. **Indeterminate:** a required input, compatibility rule, comparison mapping,
   or runtime-state fact is missing, stale, unresolved, or non-comparable. It
   fails closed and may never be guessed into a more permissive verdict.

Every material path must have a path-level result and stable explanation. The
target verdict is the least permissive required result: Incompatible takes
precedence, then Indeterminate, Migration Required, Reset Required, and In-Place
Compatible; Initial Provision Compatible applies only to a declared clean
target. More restrictive path diagnostics remain visible even when another
category determines the target verdict.

Initial Provision Compatible and In-Place Compatible may satisfy the
compatibility prerequisite for Blueprint Approval Eligibility. Reset Required
may also do so only when clean reprovisioning is supported and the review bundle
exposes the complete reset scope, affected fictitious data, and separate reset
authorization boundary. Migration Required, Incompatible, and Indeterminate
block Blueprint Approval Eligibility in v1.

Each retail or cafe Sandbox target receives its own verdict; an aggregate label
may summarize but may never hide a target-specific result. Any change to a bound
input makes the verdict stale and requires recomputation. Equal Blueprint
Content Identity, a prior verdict, owner preference, or successful validation
cannot transfer compatibility to another Blueprint Reference or target
baseline.

This contract decides compatibility inputs, categories, aggregation, and their
v1 eligibility consequences only. It does not decide provisioning steps,
migration design, rollback behavior, reset authorization, or applied-state
transitions.

This ticket remains claimed until the remaining Business Blueprint schema and
lifecycle decisions are resolved.
