# 11 — Pause, resume, budget, retry, correct, and complete a run

**What to build:** A local operator can observe one durable Orchestration Run pause for human, retry, budget, task, or baseline reasons, resume safely, correct forward, submit idempotent Kernel Commands, and complete only after exact durable evidence satisfies every Required Completion Condition.

**Blocked by:** 10 — Enforce the fail-closed governance and invariant matrix.

**Status:** ready-for-agent

- [ ] One stable opaque Orchestration Run Identity owns the scoped objective, while every model or tool attempt receives a new immutable Agent Run Identity and preserves predecessor, inputs, versions, usage, and outcome.
- [ ] Created, Active, Waiting, Completed, Failed, and Cancelled states; all declared Control Phases; and all six Wait Reasons follow only their allowed attributable transitions, with terminal continuation requiring a new run.
- [ ] Clarification, Review, Kernel Submission, Budget, and Recovery Human Gates each bind one immutable atomic subject, eligible responder, closed responses, precise effect and non-effect, review material, baseline, and freshness boundary.
- [ ] Safe resume verifies control state, definitions, artifacts, gate subject, budget, versions, and expected Kernel baselines; mismatch becomes a recorded Resume Blocker and never silently rebases, migrates, or acquires authority.
- [ ] The Balanced Local Slice Profile begins with exact hard ceilings of 128 Agent Runs, 300,000 input tokens, 60,000 output tokens, 24 provider requests, 96 tool or task attempts, 8 transient retries, 48 Kernel deliveries, 60 active minutes, 7 elapsed days, and USD 5.00 only when authoritative spend measurement exists.
- [ ] Reservations, consumption, release, and remaining budget reconcile monotonically; Waiting pauses only active time, and one explicit Budget Gate may make a bounded amendment without resetting usage or granting governed authority.
- [ ] A transient unknown outcome queries the durable result first and retries only the unchanged operation and identity within limits; durable rejection, stale baseline, safety failure, or changed input follows correction or recovery rather than retry.
- [ ] Every incomplete control step creates one immutable Failure Record with one deterministic stable code, Failure Class, effect status, consumed budget, safe diagnostic, and permitted disposition under the exact failure-policy version.
- [ ] Correctable proposals create new immutable subjects and Agent Runs; a third recurrence of the same failure tuple waits at a Recovery Gate, while governed truth changes only through separately authorized compensating Kernel Commands.
- [ ] Read-only Observation Records classify each declared Completion Condition as Satisfied, Unsatisfied, or Indeterminate from exact durable sources and never create Evidence, approval, or business truth.
- [ ] The run reaches Completed only from Active and Observing through an atomic fail-closed evaluation of all Required conditions, gates, commands, effects, failures, tasks, attempts, versions, baselines, and budget, producing one immutable Run Completion Record.
- [ ] Public-behavior tests cover pause/resume, exact retry, budget exhaustion and amendment, correction escalation, Indeterminate observation, successful completion, and replay of the recorded result.
