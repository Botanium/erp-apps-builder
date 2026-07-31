# Research agent control and durable workflow patterns

Type: research  
Status: resolved
Blocked by: None

## Question

Which first-party agent-runtime and durable-workflow primitives best support
explicit human gates, resumable execution, observation, correction, budgets,
and deterministic side effects for the Reference Vertical Slice?

## Evidence expected

A cited research note based on official documentation, specifications, source
code, or first-party APIs.

## Answer

[Research note: Agent control and durable workflow patterns](../research/03-agent-control-and-durable-workflows.md)

Primary-source evidence supports a layered control contract rather than one
runtime owning the full system: agent-native interruptions govern proposals;
checkpoint or event-history orchestration provides pause/resume, bounded
retries, and recovery; and idempotent Business Kernel commands remain the only
authority for version-specific Blueprint Approval and business side effects.
Runtime traces and histories are operational evidence, not the canonical
domain audit record. Final stack selection remains deferred to the architecture
ticket.

## Review

Resolved on 2026-07-31 after checking the central claims against official
OpenAI Agents SDK, LangGraph, Temporal, and OpenTelemetry documentation. The
sources directly support interruption and resumption, replay constraints,
idempotent side effects, deterministic workflow boundaries, versioned paused
state, and correlated operational traces. The three-layer control contract is
clearly presented as this project's evidence-backed synthesis, not a claim
that one vendor supplies Business Kernel authority. Runtime selection remains
deferred to the architecture ticket.
