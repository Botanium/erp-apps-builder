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

This ticket remains claimed until the remaining Business Blueprint schema and
lifecycle decisions are resolved.
