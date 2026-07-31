# Agent control and durable workflow patterns

Research date: 2026-07-31
Wayfinder ticket: [Research agent control and durable workflow patterns](../issues/03-research-agent-control-and-durable-workflows.md)

## Scope

This note evaluates first-party primitives for the Reference Vertical Slice's
agent control loop. It covers explicit human gates, durable pause/resume,
observation, correction, budgets, idempotency, deterministic side effects,
retries, failure recovery, and auditability.

It does **not** select the final stack, authorize production infrastructure, or
allow an agent runtime to own Blueprint Approval, authorization, ledger
posting, stock arithmetic, or other Business Kernel truth.

## Short answer

No single runtime primitive safely owns the whole problem. The strongest
architecture-neutral pattern is a three-layer contract:

1. An **agent-run layer** may propose schema-constrained configuration, expose
   pending tool calls, track usage, and pause/resume a model loop.
2. A **durable orchestration layer** persists explicit states and external
   messages, retries bounded idempotent work, and resumes after process failure.
3. The **Business Kernel** remains the only authority for the version-specific
   Blueprint Approval command and for deterministic business transitions.

OpenAI Agents SDK `interruptions` and serializable `RunState`, LangGraph
`interrupt` plus checkpointers/tasks, and Temporal workflow history plus
Signals/Updates/Activities all provide useful pieces. Their first-party docs
also expose the same caution: resumption relies on replay, and side effects can
execute again unless isolated and made idempotent. Therefore the Reference
Vertical Slice should test the control contract independently of the eventual
orchestration product.

## Evaluated primitives

### Agent-run control: OpenAI Agents SDK

- A tool can declare `needs_approval`; the run returns pending
  `interruptions`, and a reviewer can approve or reject a specific call before
  resuming the original run. `RunState` can be serialized for a later process
  to resume the run. The state includes approvals, usage, tool input, nested
  agent resumptions, and trace metadata
  ([HITL guide](https://openai.github.io/openai-agents-python/human_in_the_loop/),
  [RunState source/API](https://openai.github.io/openai-agents-python/ref/run_state/)).
- `max_turns` is a hard model-loop bound; token and request usage are aggregated
  on the run context. These are useful budget inputs, but a product-level cost,
  elapsed-time, and side-effect budget still needs application policy
  ([running agents](https://openai.github.io/openai-agents-python/running_agents/),
  [usage](https://openai.github.io/openai-agents-python/usage/)).
- Built-in traces cover generations, tool calls, handoffs, guardrails, and
  custom events. Trace payloads may contain sensitive inputs and outputs;
  tracing can be disabled and is unavailable under OpenAI Zero Data Retention.
  It is therefore observability, not the canonical business audit record
  ([tracing](https://openai.github.io/openai-agents-python/tracing/)).
- The SDK itself points long waits, retries, and process restarts to durable
  orchestration integrations. That is evidence that serializable run state is
  a pause/resume primitive, not by itself a complete durable side-effect engine
  ([durable integrations](https://openai.github.io/openai-agents-python/running_agents/#durable-execution-integrations-and-human-in-the-loop)).

### Stateful agent orchestration: LangGraph

- `interrupt()` persists graph state through a checkpointer and waits until the
  same thread is resumed with `Command(resume=...)`. Interrupt payloads can
  support approval, rejection, or human-edited content
  ([interrupts](https://docs.langchain.com/oss/python/langgraph/interrupts)).
- Checkpoints preserve thread state for HITL, fault recovery, state history,
  replay, and forking. In-memory checkpointers do not survive a restart;
  durability depends on the selected persistent checkpointer
  ([persistence](https://docs.langchain.com/oss/python/langgraph/persistence)).
- Resume restarts from a checkpoint boundary; a node containing an interrupt
  runs again from its beginning. Side effects before an interrupt must be
  idempotent or separated. Functional API tasks persist results, but a task
  that started and did not finish can run again, so write operations still need
  idempotency keys or existing-result checks
  ([interrupt rules](https://docs.langchain.com/oss/python/langgraph/interrupts#side-effects-called-before-interrupt-must-be-idempotent),
  [tasks and determinism](https://docs.langchain.com/oss/python/langgraph/functional-api#determinism)).
- State history and time travel enable inspection and corrected forks, but
  replay re-executes downstream model calls, API calls, and interrupts. This is
  suitable for correcting a proposal branch; it must never silently undo a
  committed stock or ledger transition
  ([time travel](https://docs.langchain.com/oss/python/langgraph/use-time-travel)).

### General durable orchestration: Temporal

- A Workflow Execution persists state and rebuilds it by replaying Event
  History. Generated commands are checked against history; recovery continues
  after the latest recorded event
  ([workflow execution](https://docs.temporal.io/workflow-execution)).
- Workflow code must produce the same workflow commands in the same order on
  replay. Non-deterministic work such as LLM calls, database queries, and
  external APIs belongs in Activities outside the replay path
  ([workflow determinism](https://docs.temporal.io/workflow-definition#deterministic-constraints)).
- Queries inspect state, Signals asynchronously change state, and Updates are
  trackable synchronous requests that may validate, mutate state, and return a
  result. Accepted Updates are recorded in Event History, making Signals or
  Updates plausible transport primitives for an external owner decision
  ([workflow message passing](https://docs.temporal.io/develop/python/workflows/message-passing)).
- Activities are retryable units for external and non-deterministic work.
  Temporal recommends idempotent Activity implementations; retries start a new
  attempt, and default Activity retries are exponential and unlimited unless
  bounded. Product policy must therefore set explicit attempts, timeouts, and
  non-retryable errors
  ([activities](https://docs.temporal.io/activities),
  [retry policies](https://docs.temporal.io/encyclopedia/retry-policies)).
- Event History and Visibility provide durable execution evidence and operator
  search. They remain runtime evidence, not substitutes for the Business
  Kernel's domain audit record
  ([visibility](https://docs.temporal.io/visibility)).

### Cross-runtime observation: OpenTelemetry

OpenTelemetry traces correlate spans across processes using trace and span IDs,
attributes, events, and links. This is a useful vendor-neutral correlation
contract for an interview run, Blueprint version, approval request, and kernel
command. Telemetry can be sampled, redacted, or unavailable, so it must not be
the only record of an approval or posting
([trace concepts](https://opentelemetry.io/docs/concepts/signals/traces/)).

## Evidence matrix

| Concern | First-party primitives with strongest evidence | Constraint for this product |
|---|---|---|
| Explicit human gate | OpenAI tool `interruptions` and `RunState`; LangGraph `interrupt`/`Command`; Temporal Signal or validated Update | Runtime approval may permit a proposed tool call, but only a kernel command containing the exact Draft Blueprint version can create Blueprint Approval. |
| Durable resume | Serializable agent `RunState`; checkpointed graph thread; Event History replay | Persist schema/runtime version with paused state. Rebuild the same compatible agent/workflow definition before resume. |
| Observation | Agent traces and usage; graph event stream/state history; workflow history/Visibility; OpenTelemetry correlation | Separate operational telemetry from canonical domain evidence. Correlate both with stable IDs. |
| Correction | Reject/edit interruption; graph state update/fork; new external workflow message | Correct proposals by creating a new Draft Blueprint version. Correct committed business effects with explicit reversal/compensation, never checkpoint mutation. |
| Budget | `max_turns` and token/request usage; graph recursion/runtime limits; workflow timeouts/retry policies | Enforce a composed budget: model turns/tokens, wall time, retry attempts, and permitted side-effect count. Fail closed before any kernel command once exhausted. |
| Determinism | Graph task-result replay; workflow command/Event History replay | LLM calls and external I/O are non-deterministic activities/tasks. Business outcomes come only from deterministic kernel validation and transitions. |
| Idempotency | LangGraph explicitly requires idempotent side effects; Temporal recommends idempotent Activities | Every kernel command and external activity carries a stable idempotency key; duplicate execution returns the recorded result instead of posting again. |
| Retry/failure recovery | Checkpointer replay and pending writes; Activity retries and history replay | Retry only classified transient failures. Approval rejection, schema rejection, exhausted budget, and invariant violation are terminal or human-correctable, not blind retries. |
| Auditability | Runtime interruption/history/trace evidence | Record actor, decision, exact version/hash, timestamp, reason, prior state, resulting state, command ID, and invariant result in the kernel audit stream. |

## Failure modes to design against

1. **Approval conflation.** Treating a runtime `approve()` call as Blueprint
   Approval loses the exact Blueprint version and domain authority. A runtime
   approval may only authorize submission of a separate kernel command.
2. **Stale approval.** A Draft Blueprint changes while an approval request is
   waiting. The kernel must compare version and content hash and reject the old
   decision.
3. **Duplicate side effect after resume.** Checkpoint and history runtimes may
   restart nodes, tasks, or Activities. A stable command/idempotency key and a
   recorded outcome are mandatory for payment, stock, ledger, and provisioning
   effects.
4. **Unbounded retry or spend.** Temporal Activity retries are unlimited by
   default, and an agent loop can continue until its turn limit. The slice must
   set explicit retry, turn/token, elapsed-time, and action ceilings.
5. **Non-deterministic replay.** Clock reads, random branching, LLM calls, or
   mutable external reads inside deterministic control logic can choose a
   different route after recovery. Capture their outputs as immutable task or
   Activity results before routing.
6. **Correction by history mutation.** Time travel is valuable for debugging
   and alternative proposal branches, but replay cannot be used to erase a
   posted ledger or stock movement. Use a new Blueprint version or compensating
   domain transition.
7. **Trace-as-audit.** Traces may be disabled, unavailable, sampled, or contain
   sensitive payloads. Canonical approval and business evidence must live in
   the kernel's domain store; traces only link and explain execution.
8. **Sensitive state persistence.** Serialized agent or graph state may include
   conversation context, tool inputs, or trace metadata. The slice should use
   fictitious data, minimize persisted context, and explicitly exclude secrets.
9. **Runtime upgrade incompatibility.** Paused state can outlive the code that
   created it. Persist an agent/workflow schema version and either resume with a
   compatible definition or terminate safely and request a new proposal.

## Implications and constraints for the Reference Vertical Slice

The slice should prove these contracts, regardless of the provisional runtime
chosen later:

- Use explicit state names such as `interviewing`, `draft_ready`,
  `awaiting_blueprint_approval`, `approved`, `provisioning`, `running`,
  `needs_correction`, `budget_exhausted`, `failed`, and `reset`.
- The approval request exposes the Blueprint version and content hash. The
  approval command contains the same version/hash, owner actor, decision, and a
  unique command ID. Interview completion, preview, and option selection cannot
  synthesize this command.
- Resuming a stale approval request after editing the Draft Blueprint must fail
  closed and point to the newer Draft version.
- Every state-changing kernel command accepts an idempotency key. The test suite
  repeats at least one approval, stock, and ledger command and proves no
  duplicate effect.
- Put LLM calls and other non-deterministic work outside kernel transition
  functions. Store the proposal result before deterministic schema validation.
- Retry only deliberately injected transient failures. Cap attempts and prove
  that invariant violations and rejected approvals are not retried.
- Persist run-control version, Blueprint version, current state, budget
  counters, pending gate, and correlation IDs so a stopped local process can
  resume without recreating an approval or business effect.
- Emit correlated operational events for interview, proposal, validation,
  gate, execution, retry, failure, and reset. Separately persist canonical
  domain evidence for Blueprint Approval, stock movements, and ledger entries.
- A clean reset may delete fictitious sandbox/runtime state, but the test must
  first demonstrate that the completed run's evidence was internally complete
  and balanced.

## Unresolved questions for later Wayfinder tickets

- Which minimal local runtime best demonstrates crash/resume and fault
  injection without adding production infrastructure to the slice?
- What is the exact canonical envelope for owner decisions and Business Kernel
  commands: IDs, version/hash, actor representation, timestamps, reasons, and
  expected prior state?
- Which run-control states belong in orchestration state versus the domain
  model, and how are they correlated without duplicating truth?
- What explicit turn, token, elapsed-time, retry, and side-effect ceilings are
  appropriate for the fictitious demonstration?
- Which evidence must survive `reset`, and which sandbox data is intentionally
  disposable?
- What compatibility rule applies when a paused run's agent instructions,
  Configuration Schema, or orchestration definition changes?

These questions should be resolved by the agent-control, kernel-contract,
invariant, architecture, and acceptance-contract tickets. They are not reasons
to select a stack in this research ticket.

## Recommendation

Adopt the **layered control contract** as a requirement for architecture
selection:

- Use native agent interruption only to govern agent/tool proposals and collect
  model-loop usage.
- Require a checkpoint/history-backed orchestrator for long waits, restart
  recovery, bounded retries, and observable state transitions.
- Route every consequential effect through an idempotent Business Kernel
  command. Only the kernel may validate Blueprint Approval, post stock or
  ledger movements, and return the recorded deterministic result.
- Treat runtime traces and histories as operational evidence correlated to, but
  never replacing, the kernel audit stream.

Ticket 13 should compare candidate stacks against this contract. The Reference
Vertical Slice should prove pause/resume, stale-decision rejection, duplicate
command suppression, bounded failure recovery, correlated evidence, and clean
reset before any production architecture is considered.

## Primary sources

- OpenAI Agents SDK:
  [human in the loop](https://openai.github.io/openai-agents-python/human_in_the_loop/),
  [running agents](https://openai.github.io/openai-agents-python/running_agents/),
  [usage](https://openai.github.io/openai-agents-python/usage/),
  [tracing](https://openai.github.io/openai-agents-python/tracing/), and
  [RunState API/source view](https://openai.github.io/openai-agents-python/ref/run_state/).
- LangGraph:
  [interrupts](https://docs.langchain.com/oss/python/langgraph/interrupts),
  [persistence](https://docs.langchain.com/oss/python/langgraph/persistence),
  [functional API tasks and determinism](https://docs.langchain.com/oss/python/langgraph/functional-api), and
  [time travel](https://docs.langchain.com/oss/python/langgraph/use-time-travel).
- Temporal:
  [Workflow Execution](https://docs.temporal.io/workflow-execution),
  [Workflow Definition and deterministic constraints](https://docs.temporal.io/workflow-definition),
  [message passing](https://docs.temporal.io/develop/python/workflows/message-passing),
  [Activities](https://docs.temporal.io/activities),
  [retry policies](https://docs.temporal.io/encyclopedia/retry-policies), and
  [Visibility](https://docs.temporal.io/visibility).
- OpenTelemetry:
  [trace concepts](https://opentelemetry.io/docs/concepts/signals/traces/).
