# Reference Vertical Slice TDD Log

This log preserves the red-green evidence for the public seams accepted in
Wayfinder Ticket 14. Times are omitted because the immutable Git history and
test output are the durable ordering evidence.

## Tracer 1: Blueprint authority

- Red: `npm test -- --test-name-pattern='Draft cannot provision'` failed with
  `ERR_MODULE_NOT_FOUND` because `ReferenceSlice.dispatch` did not exist.
- Red after initial implementation: the same test failed at the Kernel command
  boundary because the command Content Identity could not be recomputed.
- Green: the test now proves that interview completion and preview do not
  approve or provision; an Assumption blocks eligibility; confirmation creates
  a new immutable Draft; and only an exact Human Gate decision plus accepted
  Kernel Command creates Blueprint Approval.

## Tracer 2: Shared compilation and independent activation

- Red: `npm test -- --test-name-pattern='compiles once'` failed because no
  Provisioning Attempt collection or Effective Blueprint existed.
- Green: one target-neutral Effective Blueprint is compiled once from the exact
  Approved Blueprint, while two target-specific compatibility verdicts and
  atomic Provisioning Attempts apply it independently to retail and cafe.
- Accumulated suite: 2 tests passed.
