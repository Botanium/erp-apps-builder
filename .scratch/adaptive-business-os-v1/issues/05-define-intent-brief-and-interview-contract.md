# Define the Intent Brief and Owner Interview contract

Type: grilling  
Status: claimed
Blocked by: 01, 02

## Question

What structured facts, uncertainty states, sensitive-data classifications,
assumptions, and acceptance conditions must the Owner Interview capture before
it may produce a Draft Blueprint?

## Answer

### Accepted decisions

#### Intent Brief purpose and authority

An Intent Brief is a versioned, owner-reviewable Record of the business intent
captured by an Owner Interview, preserving accepted facts, unresolved
questions, assumptions, constraints, sensitive-data classifications, and
acceptance conditions together with their sources. It is input to Draft
Blueprint generation but is neither a Business Blueprint, owner approval,
executable configuration, nor authority for any Business Kernel action.

Avoid using Requirements document, prompt, transcript, app specification, or
Business Blueprint as synonyms.

#### Intent State model

Each material statement in an Intent Brief must carry exactly one Intent State
and an attributable source:

- **Confirmed:** one meaning is supported by an attributable source and
  explicitly accepted by the owner.
- **Unknown:** the answer has not been provided or established.
- **Ambiguous:** the source admits more than one plausible meaning.
- **Conflicting:** attributable sources assert incompatible meanings.
- **Assumed:** a provisional value is stated with its rationale and impact but
  is not owner-confirmed.
- **Not Applicable:** the owner explicitly accepts that the question does not
  apply.
- **Unsupported:** the requested intent lies outside a declared schema,
  Capability, or safety boundary.

Draft Blueprint generation may preserve unresolved states visibly, but it may
never treat them as Confirmed, invent missing facts, or silently coerce
unsupported intent. Which unresolved facts block Draft Blueprint generation
remains a later decision.

An Intent State is a classification attached to each material statement in an
Intent Brief that preserves whether and how its meaning is established without
granting execution authority. Avoid using confidence score, AI certainty,
completion status, or validation result as synonyms.

#### Required fact coverage

Before a Draft Blueprint may be produced, an Intent Brief must contain material
statements, each carrying an Intent State and attributable source, that cover
all eight fact families:

1. **Purpose and scope:** the owner's goal, whether this is a new system or
   replacement, target business kinds, desired outcomes, and explicit
   exclusions.
2. **Safety and jurisdiction:** operating countries, data-location, retention,
   and legal constraints; data types present; and external-AI restrictions.
3. **Business shape:** goods or services offered, Locations, operating hours,
   languages, currencies, units, taxes, and current tools or data sources.
4. **Customer and fulfillment journey:** channels, request or ordering path,
   sale, Payment, collection or fulfillment, required lifecycle states, and
   exception paths.
5. **Supply, stock, and capacity:** suppliers, purchasing, receiving, inventory
   or ingredients, service or time capacity, normalized units, and costing
   needs.
6. **People and governance:** participants, candidate Roles, responsibilities,
   governed actions, approvals, separation-of-duty needs, and Evidence duties.
7. **Money and accounting:** cash, bank, credit, deposits and refunds,
   accounting depth, fiscal and tax constraints, starting balances, and export
   needs.
8. **Experience and integrations:** device and offline needs, role-specific
   interfaces, reports and dashboards, language or branding needs, and
   external systems.

Every family must be represented, but a family may be explicitly Not
Applicable. This defines required semantic coverage only; it does not define
exact schema fields, select Capabilities, or decide which unresolved facts
block Draft Blueprint generation.

#### Sensitive Data Class model

Every data category named in an Intent Brief must carry exactly one Sensitive
Data Class, independent of its Intent State, together with an owner-reviewable
rationale and attributable source:

- **Public:** explicitly approved for public disclosure.
- **Internal:** non-public, low-harm operational data containing no
  Confidential or Restricted content.
- **Confidential:** personal, commercial, employee, customer, or detailed
  financial data whose disclosure could cause material harm.
- **Restricted:** secrets, authentication material, full payment or bank
  credentials, government identifiers or passports, medical or clinical data,
  biometrics, or data whose declared legal or owner constraint forbids external
  processing.

Mixed data inherits the most restrictive applicable class. An Unknown,
Ambiguous, or Conflicting classification is handled as Restricted until
resolved, and AI may never downgrade a class.

Public data may be eligible for external AI. Internal data requires a declared
provider policy, data minimization, and explicit owner approval. Confidential
data additionally requires supported jurisdiction and handling rules plus
redaction or minimization. Restricted data must never be sent to an external AI
provider in v1.

The Owner Interview captures sensitive-data categories and constraints, not
live credentials, payment-card numbers, identity-document contents, or medical
records. An unsupported safety profile stops Draft Blueprint generation with a
clear explanation.

A Sensitive Data Class is a governed exposure boundary, not a Role permission,
field-visibility rule, legal conclusion, or proof of compliance. Avoid using
privacy level, permission, secrecy flag, compliance status, or sensitivity
score as synonyms.

#### Assumption contract

Every Assumption in an Intent Brief must carry the Assumed Intent State and
preserve:

1. The exact provisional proposition or value.
2. Its proposer, attributable source, and recorded time.
3. Why the Assumption is needed to continue review.
4. The fact families and Draft Blueprint proposals it may affect.
5. The consequence and risk if it is false.
6. The condition, expected Evidence, and responsible reviewer needed to resolve
   it.
7. A review trigger or expiry when the Assumption is time-sensitive.

An Assumption may shape only visibly provisional alternatives within Governed
Configuration. It and every derived proposal must appear in preview and the
semantic diff. It may never be silently converted to Confirmed or used to
establish safety or jurisdiction, downgrade a Sensitive Data Class, grant
authorization, determine ledger posting or stock arithmetic, assert Blueprint
Approval, authorize destructive migration, or authorize production deployment.

A platform default used in place of unknown owner intent must be recorded as an
Assumption; a fixed Business Kernel invariant is not an Assumption. Only
explicit owner confirmation may change an Assumption to Confirmed. Rejection or
revision remains attributable. Which Assumptions block Draft Blueprint
generation or later Blueprint Approval remains a separate decision.

An Assumption is an explicitly marked, source-attributed provisional
proposition used to continue owner review while intent remains unconfirmed; it
preserves its rationale, affected scope, impact if wrong, and resolution
condition. It is not a default, inference, recommendation, placeholder, or
Confirmed fact.

#### Acceptance Condition contract

Every Acceptance Condition in an Intent Brief must carry an Intent State and
attributable source and preserve:

1. The owner-valued business outcome and why it matters.
2. Its scope across relevant Roles, Locations, Records, and Workflows.
3. The starting context, governed business action, and observable result in
   plain business language.
4. A clear pass condition plus any explicit failure condition or exclusion.
5. The Evidence required and the owner or responsible reviewer who judges it.
6. Its criticality as Required or Desired.
7. Any Assumptions, constraints, or Sensitive Data Classes on which it depends.

The interview may help phrase or decompose an Acceptance Condition, but it may
not invent numeric thresholds, transfer an Assumption into a requirement, or
mark the condition satisfied. A Draft Blueprint must trace its proposals back
to the Acceptance Conditions they address and must expose conditions it cannot
satisfy or cannot yet evaluate.

An Acceptance Condition guides owner review; it is not Blueprint Approval, an
implementation test, a feature checklist, a KPI, or Evidence that the outcome
has passed. The later Reference Vertical Slice acceptance contract owns
executable scenarios, fixtures, invariant checks, reset proof, and final
acceptance evidence.

An Acceptance Condition is an owner-defined, source-attributed, observable
criterion in an Intent Brief stating which business outcome a proposed Business
Blueprint must make demonstrable and what Evidence would satisfy it. Avoid
using Blueprint Approval, test case, feature checklist, KPI, or proof of
completion as synonyms.

This ticket remains claimed until the remaining Owner Interview contract
decisions are resolved.
