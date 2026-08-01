# Ticket 11 prototype evaluation

Date: 2026-08-02  
Scope: disposable, fictitious, non-authoritative local UI only

## Verdict

Adopt **Variant A — Guided cockpit** as the primary interaction model, with the
complete fact-family table from **Variant B — Evidence workbook** available as
a secondary review surface before approval.

Variant A keeps one owner question, its recommended answer, Intent State,
source, Sensitive Data Class, and Acceptance Condition beside a persistent
Draft Blueprint preview. The preview keeps the exact Blueprint reference,
Content Identity, Semantic Diff, exclusions, blockers, and the separate
approval action visible throughout the interview. This most clearly preserves
the boundary between confirming intent and approving an exact Blueprint.

Variant B is valuable for completeness and cross-family audit but is too dense
for the primary interview. Variant C communicates the authority story well but
separates details across a long scroll and makes comparisons slower.

## Observed behavior

- All three structurally different variants loaded on one route and remained
  shareable through `?variant=A`, `?variant=B`, and `?variant=C`.
- Left and right arrow keys moved between variants without editing the subject.
- An active Assumption displayed its source and blocked Approval Eligibility;
  the approval action was disabled.
- Explicit owner confirmation changed the displayed Intent State, removed the
  open item, and made the exact Draft Approval Eligible without approving it.
- The approval action opened a separate confirmation naming the exact Blueprint
  Reference and Content Identity and explicitly stated its non-effects.
- Only the second explicit approval action changed the prototype display to
  Approved. The stub submitted no Kernel Command and created no governed truth.
- The final browser pass reported zero console errors and zero warnings at a
  1440 by 1000 viewport.

## Decision absorbed

The later Reference Vertical Slice should implement only the validated
interaction contract, not copy this throwaway HTML:

1. progressive, one-material-question Owner Interview;
2. inline Intent State, source, Sensitive Data Class, and Acceptance Condition;
3. persistent Draft Blueprint preview with exact identity and Semantic Diff;
4. visible blockers, Assumptions, Unsupported intent, and exclusions;
5. secondary complete evidence-workbook review; and
6. a separate explicit approval confirmation bound to one exact eligible Draft.
