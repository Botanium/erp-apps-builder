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
