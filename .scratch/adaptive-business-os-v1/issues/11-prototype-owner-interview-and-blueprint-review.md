# Prototype the Owner Interview and Blueprint review

Type: prototype  
Status: resolved
Blocked by: 05, 06, 08

## Question

Which interaction model makes uncertainty, assumptions, exclusions, version
differences, and Blueprint Approval clear enough for an owner to make an
informed decision?

## Answer

Adopt a progressive **Guided cockpit** as the primary Owner Interview and
Blueprint review interaction, with a complete **Evidence workbook** available
as a secondary pre-approval review surface. This is the recommended option
accepted under the owner's standing approval for the remaining Wayfinder
tickets.

## Prototype evidence

- **Throwaway branch:** `codex/prototype-owner-interview-review`
- **Prototype commit:** `bc0c18f`
- **Run command:** `npm run prototype`
- **Route:** `http://127.0.0.1:4173/?variant=A`
- **Scope:** local, fictitious, non-authoritative UI stubs; no Business Kernel
  command or governed state mutation

The disposable prototype compared three structurally different models on one
route:

1. **A — Guided cockpit:** an eight-family interview rail, one material question
   in the center, and a persistent Draft Blueprint preview and authority gate.
2. **B — Evidence workbook:** a dense cross-family table with Intent State,
   source, exposure, traceability, Semantic Diff, and decision panel.
3. **C — Decision journey:** a narrative, chapter-based progression from owner
   language through proposed configuration to the separate authority gate.

A real-browser pass at a 1440 by 1000 viewport observed all three variants,
keyboard switching, the exact blocked-to-eligible transition, the separate
approval confirmation, and the final prototype-only Approved display. The
final pass reported zero console errors and zero warnings.

## Accepted interaction contract

1. The primary Owner Interview presents one material question at a time within
   the eight required fact families. It provides a recommended answer and
   concrete alternatives without answering for the owner.
2. Every answer keeps its Intent State, attributable source, Sensitive Data
   Class, dependent Acceptance Conditions, constraints, and exclusion or
   Unsupported disposition visible beside it. Free-text transcript is not the
   owner-review unit.
3. A persistent Draft Blueprint preview shows the exact Blueprint Reference,
   Blueprint Content Identity, lifecycle state, Approval Eligibility,
   governing Version Set, changed Capabilities, Locations, Records, Workflows,
   Roles, Evidence duties, Policy Profiles, experience, integrations, and
   Intent Traceability at the level needed for the current question.
4. Unknown, Ambiguous, Conflicting, Assumed, Unsupported, excluded, and Not
   Applicable intent remain visually distinct. A blocking Assumption or other
   blocking state names its reason and keeps the approval action disabled.
5. Confirming or correcting interview intent creates or references a new
   attributable Intent Brief update and then refreshed Draft review material.
   It never mutates the prior material or counts as Blueprint Approval.
6. A schema-aware Semantic Diff is always available from the declared Approval
   Baseline. It groups owner-visible changes, links each change to source intent
   and Acceptance Conditions, and exposes additions, removals, changes,
   explicit reordering, exclusions, and non-comparable paths.
7. Before approval, the owner can open the Evidence workbook to review all eight
   fact families and every active proposal, source, exposure class,
   traceability link, diagnostic, Assumption, Unsupported request, exclusion,
   and Required or Desired Acceptance Condition disposition in one complete
   review surface.
8. Blueprint Approval is a separate explicit confirmation. It names the exact
   immutable Blueprint Reference and Content Identity, states what approval
   authorizes and does not authorize, and remains disabled until the exact
   Draft is currently Approval Eligible. Interview completion, preview viewing,
   navigation, option selection, workbook viewing, and warning acknowledgement
   are visibly stated not to be approval.
9. The approval interaction produces only an attributable owner decision for a
   typed Kernel Command path. A prototype click, UI state, Agent Run, or Human
   Gate never creates Blueprint Approval or provisioning authority by itself.
10. The presentation must keep the non-authoritative Draft, explicit owner
    decision, and later Business Kernel result as three distinct states. Stale
    content or baseline invalidates the decision surface and requires refreshed
    review rather than silently carrying the selection forward.

## Variant disposition

- **Variant A is accepted** because it keeps source, uncertainty, proposed
  configuration, blockers, Semantic Diff, and the authority boundary visible
  while the owner answers one question.
- **Variant B is absorbed as the secondary complete-review surface** because it
  makes omissions and cross-family inconsistencies easy to inspect but is too
  dense for the primary interview.
- **Variant C is rejected as the primary model** because its long narrative
  scroll separates the current question from exact diffs and the approval gate.
  Its plain-language authority explanation may inform copy, not layout.

The prototype HTML remains only on the throwaway branch. The later Reference
Vertical Slice must implement this interaction contract through its approved
public seams rather than promote the disposable prototype code.
