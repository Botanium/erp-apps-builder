# Define the agent control loop and human gates

Type: grilling  
Status: claimed
Blocked by: 03, 05, 06, 07

## Question

What planning, proposal, validation, approval, execution, observation,
correction, budget, and failure states govern the agent loop, and which
transitions require explicit human action?

## Answer

### Accepted decisions

#### Three-layer agent-control authority contract

Use a strict three-layer agent-control authority contract.

1. **Agent Run:** An Agent Run may interview, plan, explain, read permitted
   context, and propose schema-constrained actions, but it may not grant
   approval, authorization, or mutate governed state.
2. **Orchestration Run:** A durable Orchestration Run may persist control
   state, pending Human Gates, budgets, retries, task results, and correlation
   identities, but it may not create business truth or silently reinterpret
   owner decisions.
3. **Business Kernel:** The Business Kernel remains the sole authority for
   validating typed, idempotent Kernel Commands and for creating Blueprint
   Approval, Business Events, Record or Workflow transitions, Evidence duties,
   Stock Movements, Ledger Entries, provisioning, and Sandbox Reset truth.

A runtime approval may authorize submission of a Kernel Command but is never
itself Blueprint Approval or governed-action authority. Agent and orchestration
traces are operational records correlated with, but never substituted for,
Kernel Evidence or audit truth. No layer may acquire another layer's authority
through configuration, model output, replay, retry, or operator editing.

This contract fixes only control authority and state ownership. Durable run
identity and safe resume, loop states, Human Gates, command idempotency and
retry, budgets, failure and correction, and observation remain later decisions
in this ticket.

#### Durable run-identity and safe-resume contract

Use one stable, globally unique, opaque Orchestration Run Identity for the
whole scoped objective, with immutable, uniquely identified Agent Run attempts
beneath it.

1. Assign the Orchestration Run Identity once and never reuse or transfer it.
   Bind the run to its exact scoped objective and attributable initiating
   source; Tenant when applicable; source artifacts; orchestration definition;
   agent instructions, tool, policy, and model version set; current control
   state; pending Human Gate; budget counters; immutable task-result
   references; correlation identities; expected Business Kernel baselines; and
   effective and recorded times.
2. Assign a new globally unique, opaque Agent Run Identity to every model-led
   or tool-execution attempt. Each Agent Run identifies its parent
   Orchestration Run and exact inputs, governing version set, usage, outcome,
   and predecessor when applicable. Retry or resume never overwrites an
   earlier attempt or result.
3. Pause and resume continue the same Orchestration Run. When model-led or tool
   work continues, resume creates a new Agent Run attempt; it does not pretend
   the earlier attempt never stopped.
4. Resume must fail closed unless the persisted control state, bound
   orchestration and agent definition versions, referenced artifacts, pending
   Human Gate subject and freshness, budget state, and expected Business Kernel
   baselines are intact and compatible. A mismatch leaves governed state
   unchanged and produces an owner-reviewable Resume Blocker; it requires an
   explicit replan or a new Orchestration Run rather than silent migration,
   guessed repair, or reinterpretation.
5. Resume and replay may reuse completed immutable task results. Any repeated
   Kernel Command must retain its original idempotency identity and return its
   recorded result, so replay cannot duplicate Blueprint Approval or governed
   effects.
6. Neither run identity, current control state, successful resume, nor a
   completed Agent Run grants approval, authorization, or execution authority.

This contract fixes only durable run identity and safe resume. The exact
control-state model and transitions, Human Gate contract, budget and retry
policy, failure and correction rules, and observation contract remain later
decisions in this ticket.

#### Orchestration Run control-state contract

Use three orthogonal, closed, externally recorded classifications rather than
one overloaded flat status.

1. Every Orchestration Run carries exactly one Orchestration Run State:
   - **Created:** its identity and bound objective exist, but control work has
     not started.
   - **Active:** it may advance one declared control step within budget and
     policy.
   - **Waiting:** it is durably stopped at one declared Wait Reason and may not
     advance autonomously.
   - **Completed:** its declared orchestration objective and required
     observation are complete; this is terminal but is not owner acceptance,
     Blueprint Approval, or authority beyond the exact Kernel results it
     references.
   - **Failed:** a classified non-recoverable orchestration failure ended the
     run; this is terminal and does not reverse or reinterpret governed truth.
   - **Cancelled:** an attributable human cancellation ended the run before
     completion; this is terminal and does not undo governed effects.
2. Every nonterminal run after work starts carries exactly one Control Phase,
   retained while Waiting: Interviewing, Planning, Proposing, Validating,
   Requesting Human Decision, Submitting Kernel Command, Observing, or
   Correcting. These name orchestration work only. Requesting Human Decision is
   not Blueprint Approval, and Submitting Kernel Command is not Business Kernel
   execution.
3. A run in Waiting carries exactly one Wait Reason: Human Gate, Retry Backoff,
   Explicit Pause, Resume Blocker, Budget Exhausted, or Task Result. A run
   outside Waiting carries none. Each waiting record binds the exact pending
   subject, responsible resolver when applicable, freshness or expiry boundary,
   and declared condition for resumption.
4. Allowed state transitions are creation to Created; Created to Active; Active
   to Waiting, Completed, Failed, or Cancelled; and Waiting to Active, Failed,
   or Cancelled. Created may also become Cancelled before work starts.
   Completed, Failed, and Cancelled are terminal; continuation always creates a
   new Orchestration Run.
5. Control Phase changes only while Active and only according to the bound
   orchestration definition. Waiting retains the phase at which work stopped.
   Waiting returns to Active only after its exact wait condition is satisfied
   and the safe-resume, freshness, compatibility, and budget checks pass.
6. Recoverable transient failure enters Waiting with Retry Backoff; a
   correctable proposal or input returns to Active in Correcting; Resume
   Blocker and Budget Exhausted enter Waiting and never clear automatically.
   Only a classified non-recoverable orchestration failure enters Failed.
7. Every state, phase, and wait transition is immutable and attributable and
   records prior and resulting classifications, trigger, reason, effective and
   recorded times, bound version set, and related Agent Run, task-result, Human
   Gate, or Kernel Command references. No classification or transition grants
   approval, authorization, Kernel authority, or governed-state mutation.

This contract fixes only the Orchestration Run control-state model and allowed
transitions. The Human Gate contract, budget and retry policy, failure and
correction rules, and observation contract remain later decisions in this
ticket.

#### Human Gate contract

Use closed, typed, durable Human Gates bound to one exact immutable subject. A
Human Gate collects one attributable human decision needed by an Orchestration
Run; it may satisfy a Wait Reason or authorize submission of an exact request,
but it never grants Business Kernel authority or creates governed truth.

1. Use five v1 Human Gate Types:
   - **Clarification Gate:** asks an eligible human to provide, confirm,
     disambiguate, or resolve information. Its response is input to a new
     attributable Intent Brief update or proposal; it does not mutate either
     by itself.
   - **Review Gate:** asks an eligible human to accept, decline, select, or
     request revision of one exact non-authoritative proposal or Task Result.
     Its decision is review disposition only and does not by itself establish
     Blueprint Approval or Reference Vertical Slice acceptance.
   - **Kernel Submission Gate:** asks an eligible human to Authorize Submission
     or Decline one exact proposed Kernel Command. Authorization permits only
     submission of that unchanged command under its bound baseline; the
     Business Kernel must independently validate it and may reject it.
   - **Budget Gate:** asks an eligible human to authorize or decline one
     explicit, bounded change to an Orchestration Run budget or retry ceiling.
     It changes orchestration control only and grants no governed-action
     authority.
   - **Recovery Gate:** asks an eligible human to choose one declared recovery
     path—resume, retry, replan, start a new Orchestration Run, or cancel—after
     an Explicit Pause, Resume Blocker, Budget Exhausted condition, or
     correctable failure. The chosen path remains subject to safe-resume and
     all Kernel checks.
2. Every Human Gate must carry a globally unique opaque Human Gate Identity;
   exact Human Gate Type; Orchestration Run Identity and current State, Control
   Phase, and Wait Reason; Tenant when applicable; one exact subject identity,
   version and Content Identity or non-authoritative fingerprint; the
   owner-facing question; a closed list of allowed responses; the precise
   effect and non-effect of each response; eligible human identity or capacity
   and any separation-of-duty constraint; relevant minimized source material,
   Semantic Diff, diagnostics, Evidence references, and Sensitive Data Class
   handling; expected Business Kernel baseline when relevant; creation time;
   freshness or expiry boundary; and the declared resumption condition.
3. A submitted Human Gate Decision is immutable and records the exact Human
   Gate Identity and unchanged subject; the attributable human responder; one
   allowed response and any required reason; effective and recorded times; the
   review material actually presented; and the resulting gate disposition.
   One gate accepts at most one effective decision. Correction or withdrawal
   requires a new gate and, when the subject changes, a new immutable subject.
4. Only an explicit submission through the gate counts. Interview completion,
   preview viewing, option highlighting, warning acknowledgement, inactivity,
   timeout, model output, inferred sentiment, a prior decision, or an operator
   edit cannot satisfy a Human Gate. The Agent Run may explain or recommend but
   may never answer for the human. The Orchestration Run may preserve the
   response but may not reinterpret it.
5. A response from an ineligible human, against a changed subject or baseline,
   after expiry, with an undeclared answer, or without required review material
   fails closed. The Orchestration Run remains Waiting, records a stable
   explanation, and requires a refreshed or new Human Gate. Human Gate
   decisions never transfer by equal content, related identity, replay, or
   retry.
6. Editing a gated proposal, Task Result, proposed Kernel Command, budget
   change, or recovery choice invalidates the gate and requires a new Human
   Gate. Gates may not hide or bundle unrelated decisions; v1 binds one gate to
   one atomic subject and decision.
7. A valid gate decision satisfies only its declared waiting condition. Before
   returning to Active, the Orchestration Run still performs safe-resume,
   freshness, compatibility, budget, and expected-baseline checks. Replay
   returns the recorded gate decision without asking again, but it may not
   duplicate a Kernel Command or apply the decision to changed inputs.
8. Authorize Submission never means the Kernel Command succeeded. For Blueprint
   Approval, provisioning, governed actions, or Sandbox Reset, only the
   Business Kernel's accepted command and resulting authoritative record
   establish truth. A declined or stale gate changes no Blueprint Lifecycle
   State, Record, Workflow, Business Event, Stock Movement, Ledger Entry,
   Applied Blueprint, or Sandbox generation.

This contract fixes only Human Gate types, envelope, explicit-action,
freshness, and authority. The Kernel Command idempotency and retry contract,
budget policy, failure and correction rules, and observation contract remain
later decisions in this ticket.
