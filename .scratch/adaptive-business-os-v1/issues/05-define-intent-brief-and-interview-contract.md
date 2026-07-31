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

This ticket remains claimed until the remaining Owner Interview contract
decisions are resolved.
