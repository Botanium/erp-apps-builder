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
