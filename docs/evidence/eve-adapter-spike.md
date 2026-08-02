# Eve Runtime Adapter adoption evidence

- **Date:** 2026-08-02
- **Branch:** `codex/eve-adapter-spike`
- **Scope:** Local, fictitious Reference Vertical Slice delivery Adapter
- **Decision:** [ADR 0002](../adr/0002-eve-agent-runtime-adapter.md)

## Candidate identity

- Node.js: `v24.16.0`
- Eve: `0.29.5`
- AI SDK: `7.0.48`
- Zod: `4.4.3`
- Model: deterministic `mockModel`; no provider credential or provider request
- Eve tools exposed: `start_owner_interview`, `answer_owner_interview`,
  `review_intent_brief`, `observe_empty_authority`, and
  `submit_kernel_command`
- Default shell, file, web, task-list, question, skill-loading, and delegation
  tools: disabled

## Verified behavior

1. `ReferenceSlice.dispatch` starts, answers, and reviews the Owner Interview
   through the Eve HTTP delivery surface.
2. `BusinessKernel.observe` proves that interview work creates no Blueprint
   Approval, Applied Blueprint, Record, Business Event, Stock Movement, or
   Ledger Entry.
3. `submit_kernel_command` parks for Eve delivery approval before invoking
   `BusinessKernel.submit` with one closed typed empty-authority command.
4. Repeating the exact Kernel Command Identity and content returns the same
   durable Accepted result while the Kernel records one result and no business
   effect.
5. The core `src/` and `test/` trees import no Eve package. The existing public
   contract suite remains independently runnable.
6. Eve-derived workflow, eval, build, and Adapter state remains under ignored
   `.eve/` or `.output/` paths; no provider, external service, production
   system, credential, or real data is used.

## Verification results

| Check                               | Result                                                  |
| ----------------------------------- | ------------------------------------------------------- |
| Existing Node public-behavior suite | 48 of 48 passed                                         |
| `eve info --json`                   | `ready`; 0 errors; 0 warnings; exactly 5 authored tools |
| Provider-free Eve integration evals | 4 of 4 passed; 36 of 36 gates passed                    |
| Eve production build                | Passed; local derived output generated                  |
| Core Eve-import scan                | No matches in `src/` or `test/`                         |
| Git whitespace check                | Passed                                                  |

The Eve local eval runner consistently printed a post-success local-queue HTTP
503 message while shutting down its temporary server, after reporting all
gates passed and returning exit code 0. This is retained as an Adapter-runtime
advisory; it is not treated as Business Kernel failure or silently promoted to
production durability evidence.

## Boundary

This evidence proves only the removable Eve delivery Adapter. It does not
record Ticket 02 human acceptance, a project Human Gate Decision, Blueprint
Approval, Reference Vertical Slice acceptance, deployment, production
readiness, external service access, or real-data handling. No branch is merged
or pushed by this evidence.
