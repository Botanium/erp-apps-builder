# Define the agent control loop and human gates

Type: grilling  
Status: resolved
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

#### Kernel Command envelope, idempotency, and retry contract

Use one immutable, typed Kernel Command with one stable idempotency identity and
one durable Kernel Command Result. Every retry submits the exact same command;
the Business Kernel is the sole processor and returns the previously recorded
result instead of repeating governed effects.

1. Every Kernel Command must carry a globally unique opaque Kernel Command
   Identity assigned once and never reused or transferred. That identity is its
   idempotency identity. The command also carries a deterministic Kernel Command
   Content Identity over its canonical authority-relevant content so changed
   inputs cannot hide behind the same identity.
2. The closed command envelope must contain the Kernel Command Identity and
   Content Identity; exact Tenant and Location scope when applicable; declared
   governed-action identity and exact version; target Record, Workflow,
   Blueprint, Sandbox Experience, or other declared subject identities; exact
   expected prior state, Version, Content Identity, or explicit absence required
   by that action; complete schema-constrained typed input; attributable
   responsible source; command creation time and requested effective time; exact
   Business Kernel and Capability Version Set; required Role, Evidence, policy,
   and separation-of-duty references; Human Gate Identity and Human Gate
   Decision when submission was gated; Orchestration Run and Agent Run
   correlation identities; causation and predecessor references; and freshness
   or expiry boundary when declared.
3. The Business Kernel must validate the command under a closed schema and
   canonicalize it deterministically before processing. Unknown fields,
   unresolved references, arbitrary code, prompts, formulas, credentials,
   secrets, stale baselines, invalid authorization, missing Evidence,
   unsupported versions, or Content Identity mismatch fail closed.
   Canonicalization never repairs, defaults, or reinterprets command meaning.
4. Processing is atomic. For a previously unseen Kernel Command Identity, the
   Business Kernel binds that identity to the exact Content Identity, rechecks
   Tenant isolation, governed-action support, authorization, Human Gate
   freshness when required, expected baseline, Workflow guards, Evidence
   duties, policies, and invariants, then records exactly one immutable Kernel
   Command Result. An Accepted result commits the action's declared
   authoritative record and effects atomically. A Rejected result commits no
   governed effect and carries stable safe diagnostics.
5. Repeating a known Kernel Command Identity with the identical Content Identity
   and bound inputs returns the exact recorded Kernel Command Result and creates
   no new Blueprint Approval, Business Event, Record or Workflow transition,
   Evidence duty, Stock Movement, Ledger Entry, Payment, provisioning action,
   Applied Blueprint, or Sandbox Reset effect. Reusing the identity with any
   changed content, baseline, Human Gate Decision, Tenant, version, or scope is
   an idempotency conflict that fails closed and changes nothing.
6. Every Kernel Command Result binds the exact Kernel Command Identity and
   Content Identity; Accepted or Rejected disposition; Business Kernel and
   validator Version Set; responsible Kernel source; effective and recorded
   times; stable diagnostics; resulting authoritative record, Business Event,
   or attempt references when any; invariant results; and the command's
   causation and correlation identities. Duplicate delivery is not a new result
   or a successful new action.
7. The Orchestration Run may retry only when delivery or result retrieval failed
   transiently and the outcome is unknown to the caller. It must first query the
   durable result by Kernel Command Identity, then resend only the exact
   unchanged command with the same identity, subject to its bounded retry budget
   and backoff. Timeout, process crash, replay, or lost response never permits a
   new identity for the same attempted action.
8. A recorded Rejected result, stale baseline, invalid schema, authorization
   failure, Human Gate decline or expiry, safety violation, unsupported action,
   missing Evidence, policy failure, or invariant violation is not retryable.
   Correction requires a new attributable proposal and, where applicable, a new
   Human Gate and a new Kernel Command Identity. A new identity may not be used
   merely to bypass a prior rejection.
9. Authorize Submission permits only the first or repeated submission of the
   exact bound command. It does not force acceptance, waive Kernel checks,
   authorize changed content, or transfer to another command. Agent output,
   orchestration replay, retry policy, operator editing, equal content, or a
   prior Kernel Command Result grants no authority to construct or approve a
   different command.
10. Kernel Command acceptance proves only that the declared Kernel action
    committed and records its exact result. It does not by itself complete the
    Orchestration Run, satisfy owner acceptance, prove a business scenario,
    authorize another action, or establish production readiness.

This contract fixes only the Kernel Command envelope, Content Identity, Result,
idempotency, and retry classification. The exact run-budget policy, failure and
correction rules, and observation contract remain later decisions in this
ticket.

#### Run Budget contract

Use one immutable, versioned, composed Run Budget bound to the exact
Orchestration Run. It places monotonic hard ceilings on Agent Run attempts,
input tokens, output tokens, model or provider requests, tool and Task Result
attempts, transient retries, Kernel Command delivery submissions, active
execution time, total elapsed lifetime, and—only where independently
measurable—monetary spend. Each dimension records its exact limit, consumed
amount, reserved amount, unit, source, and measurement rule. Exact v1 default
quantities remain a later decision.

1. The initial Run Budget is attributable, bound to the Orchestration Run and
   its governing version set, and fixed before work starts. A budget constrains
   work; it never authorizes a tool, Human Gate response, Kernel Command,
   governed action, or external side effect.
2. A Control Phase, Agent Run, or task may receive a declared sub-budget or
   reservation, but its limits may not exceed or borrow beyond the parent Run
   Budget. Releasing an unused reservation is attributable and does not erase
   consumption.
3. Before starting bounded work, the Orchestration Run must reserve the declared
   worst-case measurable amount needed for that step. If a required dimension
   cannot be measured or safely reserved, the step fails closed rather than
   beginning with unbounded exposure.
4. Consumption is monotonic and recorded through immutable, attributable usage
   events tied to the responsible Agent Run, task, retry, or submission.
   Reconciliation must independently reproduce consumed, reserved, released,
   and remaining amounts.
5. Every new model request, tool execution, task attempt, transient retry, and
   command-delivery submission consumes its applicable budget even when it
   fails. Reusing an immutable Task Result or retrieving an existing Kernel
   Command Result does not repeat the prior governed effect, but any genuinely
   new computation or request is still counted.
6. Waiting stops the active-execution-time meter but does not stop the total
   elapsed-lifetime or expiry boundary. Pausing, replay, resume, process
   restart, or operator editing never resets consumption.
7. Before any hard ceiling would be exceeded, the Orchestration Run enters
   Waiting with Wait Reason Budget Exhausted. While there, it may only read
   status or an already-recorded result, persist safe control state, receive the
   pending Human Gate decision, cancel, or observe and record the outcome of an
   already-submitted Kernel Command. It may not start a new Agent Run, tool or
   task attempt, retry, or Kernel Command submission.
8. Only one valid Budget Gate decision may authorize one exact bounded change.
   The change creates a new attributable Run Budget version or amendment,
   preserves every prior limit and usage event, changes only the named
   dimensions, and may not reset counters, hide excess, or grant Business
   Kernel authority.
9. AI, orchestration policy, configuration, retry, replay, or a provider
   response may never increase, waive, pool, reinterpret, or silently default a
   Run Budget. Missing, stale, inconsistent, or non-deterministically measured
   budget state is a Resume Blocker and fails closed.
10. Budget Exhausted is not Failed, Cancelled, owner rejection, Blueprint
    Approval, Kernel rejection, or reversal of an accepted governed effect.
    Resumption requires the exact wait condition to be resolved through a valid
    Budget Gate or Recovery Gate and then pass safe-resume, freshness,
    compatibility, baseline, and budget checks.

This contract fixes only the Run Budget dimensions, accounting, amendment, and
exhaustion behavior. The exact v1 default quantities, failure and correction
rules, and observation contract remain later decisions in this ticket.

#### Balanced Local Slice default-quantity contract

Use one closed Balanced Local Slice Profile for every new local Reference
Vertical Slice Orchestration Run. It is a sandbox proof default, not a
production, customer, research, or arbitrary-development budget.

The exact cumulative hard ceilings are:

1. Agent Run attempts: 128.
2. Input tokens: 300,000.
3. Output tokens: 60,000.
4. Model or provider requests: 24.
5. Tool and Task Result attempts: 96.
6. Transient retries: 8 across the run, with at most 2 retries for any one
   operation.
7. Kernel Command delivery submissions: 48 across the run, with at most 3
   deliveries for one exact Kernel Command Identity—the initial delivery plus
   at most 2 unchanged retries.
8. Active execution time: 60 minutes.
9. Total elapsed lifetime: 7 consecutive days from run creation; Waiting pauses
   only active execution time.
10. Monetary spend: USD 5.00 only when an authoritative per-run measurement is
    independently available. Otherwise this dimension is explicitly Not
    Applicable, never zero, omitted, inferred, or unlimited.

Every attempt or retry also consumes every other applicable dimension, so the
first ceiling reached controls. Counts begin at zero, reserve before work, and
enter Waiting with Budget Exhausted before an action would exceed a ceiling. A
Budget Gate may authorize an exact bounded amendment under the accepted Run
Budget contract, but no profile value grants authority.

This contract fixes only the exact v1 default quantities for a local Reference
Vertical Slice Orchestration Run. It does not set production budgets, per-phase
reservations, provider selection, pricing assumptions, failure and correction
rules, or the observation contract.

#### Failure-classification and correction contract

Use one immutable Failure Record for every orchestration control step that
cannot complete or safely advance. Each record carries exactly one closed
Failure Class and one declared disposition. Failure classification is
operational control truth; it is not an Orchestration Run State, Human Gate
decision, Kernel Command Result, Business Event, Evidence, or governed business
truth.

1. Every Failure Record must bind a globally unique identity; exact
   Orchestration Run and Agent Run when present; Control Phase; subject, input,
   Task Result, Human Gate, or Kernel Command references; stable failure code
   and class; responsible source; effective and recorded times; bound version
   set; whether any external or governed effect is known, absent, or unresolved;
   safe diagnostics; consumed budget; retryability; and the only permitted next
   disposition. It must redact secrets and unnecessary Confidential or
   Restricted data.
2. Use exactly seven v1 Failure Classes: Transient Control Failure, Correctable
   Proposal Failure, Control Baseline Conflict, Budget Exhaustion, Kernel
   Command Rejection, Indeterminate Control Failure, and Non-Recoverable
   Orchestration Failure. Classification is deterministic under one exact
   failure-policy version; an unknown or contradictory classification becomes
   Indeterminate rather than being guessed.
3. A Transient Control Failure is a temporary transport, provider, tool, or
   result-retrieval failure where the attempted input is unchanged and
   repetition is declared replay-safe or idempotent. The run enters Waiting
   with Retry Backoff, queries any durable result first, and may retry only the
   exact same operation and identity within its retry and Run Budget limits.
   Changed input is Correction, not retry.
4. A Correctable Proposal Failure is a deterministic validation or review
   failure in non-authoritative input, a proposal, or a Task Result. The run
   enters or remains Active in Correcting and produces a new immutable Agent Run
   and subject linked to the failure. It never edits the failed artifact. A
   changed gated subject requires a new Human Gate. At most two autonomous
   correction attempts may address the same stable failure-code, subject, and
   baseline tuple; a third recurrence enters Waiting with Human Gate at a
   Recovery Gate.
5. A Control Baseline Conflict means a required artifact, expected Kernel
   baseline, bound version, Human Gate subject, Run Budget state, or policy
   input is stale, changed, missing, or incompatible. The run enters Waiting
   with Resume Blocker. It may continue only through an explicit Recovery Gate
   choice followed by safe-resume checks; it is never retried or silently
   rebased.
6. Budget Exhaustion follows the accepted Run Budget contract: the run enters
   Waiting with Budget Exhausted, performs only the permitted safe actions, and
   requires a valid Budget Gate or Recovery Gate plus safe-resume checks. It is
   not a terminal failure.
7. A Kernel Command Rejection is the durable Rejected Kernel Command Result. It
   is never retryable and cannot be bypassed with a fresh identity. When a
   declared correction path exists, Correction creates a new attributable
   proposal and, when required, a new Human Gate and new Kernel Command
   Identity. The rejection itself changes no governed state.
8. An Indeterminate Control Failure means the system cannot establish a
   complete, consistent, deterministic classification or effect status. The run
   enters Waiting with Resume Blocker, preserves the uncertainty, and requires
   a Recovery Gate; it may not retry, correct, complete, or fail permissively
   while the classification remains indeterminate.
9. A Non-Recoverable Orchestration Failure exists only when declared policy
   proves that safe continuation is impossible, such as irreconcilably
   corrupted durable control history, an isolation breach, non-deterministic
   persisted results, or absence of any compatible recovery path. The run
   enters terminal Failed. Failure never rolls back, deletes, hides, or
   reinterprets a previously accepted Kernel effect.
10. Human decline, owner rejection, cancellation, gate expiry, and a valid
    Kernel rejection are not automatically Non-Recoverable Orchestration
    Failures. Every Correction is forward-only, attributable, linked to its
    Failure Record, and budget-consuming. Governed business truth may be
    corrected only through a separately authorized compensating Kernel Command,
    never by editing an Agent Run, Failure Record, Task Result, Business Event,
    Stock Movement, Ledger Entry, or Kernel Command Result. Successful
    Correction preserves the failure history and still requires the later
    observation contract before completion.

This contract fixes only failure classification, retry-versus-Correction
boundaries, Correction lineage, escalation, and terminal failure. The exact
stable failure-code catalog and the observation and completion contract remain
later decisions in this ticket.

#### Stable failure-code contract

Use stable, project-owned codes in the exact uppercase three-part form
`ORC.<FAMILY>.<REASON>`. Every code belongs to one Failure Class through its
family, identifies one durable meaning, and determines one permitted
disposition under the exact failure-policy version. A Failure Record carries
exactly one primary code; provider messages, tool errors, validation
diagnostics, and Kernel Command Result diagnostics remain referenced details
and never become the primary orchestration code.

The closed v1 catalog is:

- `ORC.TRANSIENT`: `TRANSPORT_UNAVAILABLE`, `PROVIDER_UNAVAILABLE`,
  `PROVIDER_RATE_LIMITED`, `TOOL_UNAVAILABLE`, `RESULT_RETRIEVAL_FAILED`,
  `DELIVERY_OUTCOME_UNKNOWN`, `OPERATION_TIMEOUT`, and `PROCESS_INTERRUPTED`.
- `ORC.CORRECTABLE`: `INPUT_INVALID`, `PROPOSAL_INVALID`,
  `VALIDATION_BLOCKED`, `REVIEW_REVISION_REQUESTED`, `TASK_RESULT_REJECTED`, and
  `CORRECTION_LIMIT_REACHED`.
- `ORC.BASELINE`: `ARTIFACT_MISSING`, `ARTIFACT_STALE`,
  `CONTENT_IDENTITY_MISMATCH`, `VERSION_MISMATCH`, `KERNEL_BASELINE_CHANGED`,
  `HUMAN_GATE_STALE`, `BUDGET_STATE_MISMATCH`, `POLICY_CHANGED`, and
  `RESUME_INCOMPATIBLE`.
- `ORC.BUDGET`: `AGENT_RUN_ATTEMPTS_EXHAUSTED`, `INPUT_TOKENS_EXHAUSTED`,
  `OUTPUT_TOKENS_EXHAUSTED`, `PROVIDER_REQUESTS_EXHAUSTED`,
  `TOOL_TASK_ATTEMPTS_EXHAUSTED`, `TRANSIENT_RETRIES_EXHAUSTED`,
  `KERNEL_DELIVERIES_EXHAUSTED`, `ACTIVE_TIME_EXHAUSTED`,
  `ELAPSED_LIFETIME_EXHAUSTED`, and `MONETARY_SPEND_EXHAUSTED`.
- `ORC.KERNEL`: `COMMAND_REJECTED`, `IDEMPOTENCY_CONFLICT`,
  `AUTHORIZATION_REJECTED`, `EVIDENCE_REJECTED`, `POLICY_REJECTED`,
  `INVARIANT_REJECTED`, `SAFETY_REJECTED`, `BASELINE_REJECTED`,
  `VERSION_REJECTED`, and `SCHEMA_REJECTED`.
- `ORC.INDETERMINATE`: `CLASSIFICATION_UNKNOWN`, `CLASSIFICATION_CONFLICT`,
  `EFFECT_STATUS_UNKNOWN`, `REQUIRED_INPUT_MISSING`, `POLICY_UNAVAILABLE`,
  `MEASUREMENT_UNAVAILABLE`, `CLASSIFIER_NONDETERMINISTIC`, and
  `UNCLASSIFIED_FINDING`.
- `ORC.NONRECOVERABLE`: `CONTROL_HISTORY_CORRUPT`,
  `DURABLE_STATE_IRRECONCILABLE`, `TENANT_ISOLATION_BREACH`,
  `PERSISTED_RESULT_NONDETERMINISTIC`, `NO_COMPATIBLE_RECOVERY`,
  `POLICY_PROHIBITS_CONTINUATION`, and `AUTHORITY_BOUNDARY_BREACH`.

1. Family mapping is exact: `TRANSIENT` maps to Transient Control Failure;
   `CORRECTABLE` to Correctable Proposal Failure; `BASELINE` to Control Baseline
   Conflict; `BUDGET` to Budget Exhaustion; `KERNEL` to Kernel Command
   Rejection; `INDETERMINATE` to Indeterminate Control Failure; and
   `NONRECOVERABLE` to Non-Recoverable Orchestration Failure.
2. Code meaning, family, Failure Class, retryability, permitted disposition, and
   relative precedence are immutable within one failure-policy version. Adding,
   removing, renaming, reclassifying, or changing the disposition of a code
   requires a new failure-policy version and makes affected review or resume
   material stale.
3. For identical bound inputs, effect knowledge, and policy version,
   classification must produce the same primary code. AI, provider text,
   operator editing, localization, replay, or retry may not invent, suppress,
   remap, or downgrade a code.
4. When more than one condition applies to one failed step, the primary code is
   selected by this family precedence: `NONRECOVERABLE`, `INDETERMINATE`,
   `BASELINE`, `BUDGET`, `KERNEL`, `CORRECTABLE`, `TRANSIENT`. Within the
   selected family, a declared decision rule must yield one unique most-specific
   reason; otherwise the primary code is
   `ORC.INDETERMINATE.CLASSIFICATION_CONFLICT`. Every related finding remains
   referenced so the primary code cannot hide another cause.
5. An unknown, malformed, contradictory, or unmapped finding produces
   `ORC.INDETERMINATE.UNCLASSIFIED_FINDING`. Non-deterministic classification
   produces `ORC.INDETERMINATE.CLASSIFIER_NONDETERMINISTIC`. Neither may be
   coerced into a permissive class.
6. `ORC.KERNEL` codes summarize the primary rejection category only. The
   Failure Record must reference the exact immutable Kernel Command Result and
   all Kernel diagnostics; orchestration never rewrites or replaces Kernel
   reasoning.
7. `ORC.BUDGET` codes map one-for-one to the ten Balanced Local Slice Profile
   dimensions. A Not Applicable monetary dimension cannot emit
   `MONETARY_SPEND_EXHAUSTED`; unavailable or untrustworthy measurement emits
   `ORC.INDETERMINATE.MEASUREMENT_UNAVAILABLE` instead.
8. Owner-facing text and localization may change without changing code meaning.
   Consumers rely on the code, bound policy version, class, disposition,
   subject, and related references rather than message wording or display
   order.
9. A code is operational classification only. It is not an Orchestration Run
   State, Wait Reason, Human Gate decision, Kernel Command Result, Blueprint
   Approval, Business Event, Evidence, acceptance result, or authority.
10. Failure codes and safe diagnostics must never expose credentials, secrets,
    Restricted values, or unnecessary Confidential data. Redaction changes
    presentation only and may not change the code or hide that protected data
    was involved.

This contract fixes only the stable code format, closed v1 catalog, Failure
Class mapping, precedence, versioning, and redaction behavior. The observation
and completion contract remains the next decision in this ticket.

#### Observation and completion contract

Use immutable, typed Observation Records and one deterministic, fail-closed Run
Completion Record. Observation establishes whether each declared Completion
Condition is supported by exact durable results; it never creates governed
business truth, owner acceptance, Blueprint Approval, or execution authority.

1. Before work starts, the orchestration definition must declare every
   Completion Condition with a stable identity and version; its relation to the
   scoped objective; the exact subject and expected observable result;
   permitted authoritative or non-authoritative source kinds; required
   freshness, baseline, and bound versions; whether it is Required or Advisory;
   and the safe diagnostic to expose when it cannot be established. A running
   Agent may not invent, weaken, remove, or reinterpret a Completion Condition.
2. Every observation creates one immutable Observation Record with a globally
   unique identity; exact Orchestration Run and Completion Condition; subject
   and expected result; exact Task Result, Human Gate Decision, Kernel Command
   Result, Business Kernel authoritative-record, provisioning-attempt,
   reset-attempt, or other declared source references; observed value or
   disposition; responsible observer; effective and recorded times; bound
   versions and baselines; consumed budget; safe diagnostics; and exactly one
   Observation Verdict.
3. Use three closed Observation Verdicts: Satisfied means the exact current
   durable source proves the declared condition; Unsatisfied means a complete,
   current observation proves the condition is not met; Indeterminate means a
   required source, result, baseline, comparison, version, or effect status is
   missing, stale, inconsistent, unresolved, or non-comparable. Indeterminate
   fails closed and may never be guessed into Satisfied or Unsatisfied.
4. Agent output, a tool message, an orchestration trace, task completion, Human
   Gate viewing, Authorize Submission, Kernel Command submission, or a transient
   response cannot substitute for the exact source a condition declares. A
   governed condition may be Satisfied only from the Business Kernel's durable
   result or authoritative record. A Human Gate observation proves only its
   exact decision and declared effect; it never expands that decision into
   Blueprint Approval, owner acceptance, or governed truth.
5. Observation is read-only. It may query and correlate durable results but may
   not resubmit a command, repeat an external effect, repair a result, create
   Evidence, or mutate governed state. New observation work consumes its
   applicable Run Budget; replay may return an unchanged recorded Observation
   Record when every bound input remains identical.
6. An Unsatisfied Required condition returns the Active run to Correcting or to
   its declared recovery path and preserves the observation. An Indeterminate
   Required condition enters Waiting with Task Result or Resume Blocker
   according to the cause. Advisory conditions remain visible but cannot hide
   or override a Required result. Any changed condition, source, baseline,
   version, or subject makes the observation stale and requires a new
   Observation Record.
7. An Orchestration Run may enter Completed only from Active in the Observing
   Control Phase after an exact-versioned completion evaluator atomically
   rechecks that: the objective and orchestration definition are unchanged and
   resolvable; every Required Completion Condition has one current Satisfied
   observation; every submitted Kernel Command has one durable known Result and
   every Accepted effect required by the objective is observed; every required
   Human Gate has one valid decision; no Wait Reason, unresolved Failure Record,
   active Agent Run, active task, pending command outcome, or active
   provisioning or reset attempt remains; no required observation is
   Unsatisfied or Indeterminate; every external or governed effect status is
   known; and Run Budget usage and immutable task-result references reconcile.
8. Successful evaluation records one immutable Run Completion Record binding
   the exact Orchestration Run, objective and definition versions, final control
   state and phase, complete set of Completion Conditions and Observation
   Records, Human Gate Decisions, Task Results, Kernel Command Results, relevant
   authoritative-record references, unresolved Advisory items and exclusions,
   Failure Records, reconciled Run Budget, evaluator and policy versions,
   responsible source, and effective and recorded times. The
   Active-to-Completed transition and Run Completion Record commit atomically.
9. Partial success must remain explicit for retail and cafe or any other target.
   A run cannot aggregate partial success into Completed unless its objective
   declared a partial-result report as the intended result before execution.
   Failed or Cancelled runs never become Completed; continuation creates a new
   Orchestration Run. Replay returns the existing Run Completion Record, while
   a changed objective, condition, subject, or bound version requires a new run.
10. Completed means only that the exact orchestration objective and its declared
    observation conditions finished. It is not Blueprint Approval, Reference
    Vertical Slice acceptance, proof that an Acceptance Condition passed,
    production readiness, deployment, or authority for another action, and it
    never rolls back, deletes, or reinterprets governed effects. The later
    Reference Vertical Slice acceptance contract owns executable scenarios,
    fixtures, invariant checks, reset proof, and final owner acceptance
    Evidence.

This contract fixes the final observation-and-completion boundary for this
ticket: exact durable Observation Records determine Satisfied, Unsatisfied, or
Indeterminate Completion Conditions, and only a deterministic fail-closed Run
Completion Record may accompany the atomic transition to Completed.
