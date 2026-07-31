# Intent-to-Blueprint patterns

Research date: 2026-07-31

Wayfinder ticket: [Research intent-to-blueprint patterns](../issues/02-research-intent-to-blueprint-patterns.md)

## Scope

This note investigates patterns and failure modes for translating an owner's
conversational intent into schema-constrained, reviewable configuration that
can drive metadata-defined interfaces and workflows. It does not choose the
v1 stack, design the complete Business Blueprint, or authorize implementation.

## Source-quality rules

- Use only sources that own the behavior being described: specifications,
  official product documentation, and first-party source repositories.
- Treat examples as pattern evidence, not as a recommendation to adopt that
  product or library.
- Separate structural guarantees from semantic or business guarantees.
- Label project-specific conclusions as implications or recommendations rather
  than claims made by the source.

## Findings

### 1. Translate intent into a purpose-built response model before domain execution

Microsoft's TypeChat documents a three-part pattern: construct an LLM prompt
from types, validate the response against the schema, repair a nonconforming
response through another model interaction, and then produce a non-LLM summary
for confirmation against the user's intent. It also supports discriminated
unions for intent alternatives and a meta-schema for choosing subordinate
schemas. [TypeChat repository](https://github.com/microsoft/TypeChat)

TypeChat explicitly describes these response models as a bridge between
natural language and application logic, not necessarily the application's
storage model. Its guidance favors simple, flat, regular JSON-representable
types with explanatory comments. [TypeChat schema-engineering techniques](https://microsoft.github.io/TypeChat/docs/techniques/)

**Implication for v1:** the Owner Interview should first produce a typed
`Intent Brief` or equivalent interpretation artifact. A deterministic
normalizer can then construct a Draft Blueprint. The provider-facing response
schema and the canonical Business Blueprint schema should be allowed to differ;
coupling them would force conversational uncertainty directly into the
execution contract.

### 2. Constrained generation improves shape reliability but is not the authority

OpenAI Structured Outputs distinguishes schema-adherent output from JSON mode,
which only guarantees valid JSON. The API can constrain either a response or
function arguments with `strict: true`, but it supports only a subset of JSON
Schema. Unsupported strict schemas fail, and refusals or incomplete responses
can fall outside the requested schema. OpenAI also recommends evaluating the
schema on representative cases. [OpenAI Structured Outputs guide](https://developers.openai.com/api/docs/guides/structured-outputs)

**Implication for v1:** model-native structured output should be one transport
guard, not Blueprint validity. The Business Kernel must independently parse
and validate the candidate against the canonical schema and business policies.
Provider-specific schema subsets must not become the canonical configuration
language.

### 3. A schema is only as closed and explicit as its author makes it

JSON Schema's applicability rules can surprise implementers: `properties` does
not make fields required, misspelled keys can pass when additional properties
are permitted, and object keywords do not assert that the instance is an
object. Sound structural validation therefore requires explicit `type`,
`required`, and closed-property behavior where appropriate. [JSON Schema applicability guidance](https://json-schema.org/blog/posts/applicability-json-schema-fundamentals-part-1)

The JSON Schema specification also states that structural validation can be
insufficient for correct application use. In the default 2020-12 dialect,
`format` is an annotation rather than a required assertion; application-level
validation remains necessary. Metadata such as title, description, default,
read-only, and deprecated can help documentation and UI generation but does not
itself enforce business behavior. [JSON Schema validation specification](https://json-schema.org/draft/2020-12/json-schema-validation)

**Implication for v1:** schemas should be closed by default, identify their
dialect and version, and distinguish assertions from annotations. Cross-record
rules, authorization, stock arithmetic, ledger balance, approval truth, and
state-transition legality require deterministic Kernel validation beyond JSON
Schema.

### 4. Unknown and uncertain intent needs a first-class representation

TypeChat reports that narrow response models without an escape hatch can cause
out-of-domain requests to be coerced into an allowed intent. Its concrete
example is a coffee bot mapping "two tall trees" to tall lattes. Adding an
`unknown` category routes unsupported input visibly instead of silently
inventing a fit. [TypeChat schema-engineering techniques](https://microsoft.github.io/TypeChat/docs/techniques/)

**Implication for v1:** the interview contract should represent at least
`known`, `unknown`, `ambiguous`, `assumed`, and `unsupported` outcomes, with the
source answer or evidence attached. Missing information must not be defaulted
into a business decision merely to satisfy the schema. Repair retries may fix
shape, but they must not silently add owner intent.

### 5. Keep data meaning separate from presentation metadata

JSON Forms uses two runtime-interpreted artifacts: a data JSON Schema defining
objects, properties, and types, and a UI schema defining control order,
visibility, and layout. Controls bind to data-schema properties, while a
bounded rule vocabulary supplies `HIDE`, `SHOW`, `ENABLE`, and `DISABLE`
effects. [JSON Forms overview](https://jsonforms.io/docs/)
[JSON Forms UI rules](https://jsonforms.io/docs/uischema/rules/)

The rules documentation exposes an important edge case: an unresolved scope
validates successfully unless `failWhenUndefined: true` is set. This is an
example of metadata behavior that is structurally valid but semantically
surprising. [JSON Forms UI rules](https://jsonforms.io/docs/uischema/rules/)

**Implication for v1:** forms and layouts should be compiled from a separate,
bounded UI schema that references canonical record fields. UI rules may affect
presentation only. They must fail closed on unresolved references and must not
act as authorization, approval, workflow truth, or a substitute for Kernel
validation.

### 6. Model workflows as a bounded declarative language with static validation

Amazon States Language is a JSON-based structured workflow language. AWS can
validate a definition without creating a state machine and returns errors and
warnings with locations. A validation result may still be `OK` when warnings
exist, so consumers are told to rely only on the stable result rather than the
diagnostic wording or ordering. [AWS ValidateStateMachineDefinition](https://docs.aws.amazon.com/step-functions/latest/apireference/API_ValidateStateMachineDefinition.html)

AWS workflow versions are numbered immutable snapshots: an existing version
cannot be edited; a changed definition is published as a new version.
[AWS Step Functions versions](https://docs.aws.amazon.com/step-functions/latest/dg/concepts-state-machine-version.html)

**Implication for v1:** workflow configuration should select from an explicit
set of states, transitions, guards, and Kernel operations. A static validator
must reject missing targets, unreachable or illegal transitions, unsupported
operations, and invalid field references. Static success is necessary but not
sufficient; the Reference Vertical Slice must execute scenarios because syntax
validation cannot prove business outcomes.

### 7. Preview should run the authoritative validation path without persistence

Kubernetes server-side dry-run evaluates a request through admission,
validation, merge handling, defaulting, and schema validation while preventing
persistence and other side effects. It returns the object that would be stored,
with caveats that some generated values can differ. Dry-run requires the same
authorization as the corresponding real request. [Kubernetes API concepts](https://kubernetes.io/docs/reference/using-api/api-concepts/)

Kubernetes also demonstrates why unknown-field behavior must be explicit:
servers can ignore or warn and drop unrecognized fields, whereas strict field
validation rejects them. Structural Custom Resource Definition schemas enable
server validation and pruning, and the published schema can drive client
validation, documentation, and generation. [Kubernetes API concepts](https://kubernetes.io/docs/reference/using-api/api-concepts/)
[Kubernetes structural schemas](https://kubernetes.io/docs/tasks/extend-kubernetes/custom-resources/custom-resource-definitions/)

**Implication for v1:** Blueprint preview should use the same compiler and
validators as provisioning, stop before persistence, and show the normalized
effective result plus diagnostics. Unknown fields should be rejected rather
than silently dropped. Preview remains evidence for review; it is not Blueprint
Approval.

### 8. Review and approval must bind to an immutable effective version

The combined evidence supports a staged artifact flow: typed translation,
independent validation, normalization, static compilation, non-persistent
preview, and then execution. AWS's immutable workflow versions and Kubernetes'
optimistic `resourceVersion` conflict checks show two mature protections against
editing or acting on stale configuration. [AWS Step Functions versions](https://docs.aws.amazon.com/step-functions/latest/dg/concepts-state-machine-version.html)
[Kubernetes API concepts](https://kubernetes.io/docs/reference/using-api/api-concepts/)

**Implication for v1:** approval should name the exact normalized Blueprint
version and content identity. Any edit, repair, default change, compiler change
that alters the effective configuration, or stale-version conflict must produce
a new Draft Blueprint requiring new approval.

## Failure modes to carry into the v1 contract

| Failure mode | Required constraint |
|---|---|
| Out-of-domain intent is coerced into a valid allowed value | First-class unknown/unsupported outcomes; no auto-approval |
| Provider output is valid JSON but violates the intended schema | Strict structured output where available plus independent canonical validation |
| Provider output matches shape but invents business facts | Preserve source answers, assumptions, and uncertainty; require semantic and owner review |
| A permissive or incomplete schema accepts misspellings and wrong shapes | Explicit types, required fields, closed objects, versioned dialect, negative tests |
| Provider schema support differs from the canonical schema | Maintain a provider-facing response model and validate again against the canonical contract |
| Repair retries silently change meaning | Retain the original request and repair trace; show semantic changes; unresolved meaning returns to interview |
| Defaults or pruning change what the owner thought was proposed | Reject unknown fields and present the normalized effective Blueprint before approval |
| A UI visibility rule is treated as security or process enforcement | UI metadata affects rendering only; Kernel owns authorization and transitions |
| An undefined UI reference activates a rule unexpectedly | Validate every reference and fail closed on undefined data or schema paths |
| A statically valid workflow fails at runtime | Run scenario and invariant tests in the Reference Vertical Slice |
| Warning text or order becomes an API dependency | Define project-owned stable diagnostic codes; treat third-party diagnostics as evidence only |
| An approved artifact changes after review | Immutable versions; approval tied to exact content identity; edits create a new Draft |
| Preview is mistaken for authorization | Preview is side-effect-free and never changes approval state |

## Constraints this evidence supports for v1

1. The LLM produces proposals only; it never writes executable tenant code or
   directly provisions business state.
2. The conversational response model is separate from the canonical Business
   Blueprint and explicitly carries unknown, ambiguous, assumed, unsupported,
   and source-evidence states.
3. All generated objects pass provider-level shape constraints when available,
   canonical schema validation, reference validation, semantic policy checks,
   and deterministic compilation before owner review.
4. The canonical validator rejects unknown fields and unsupported schema
   versions; it does not silently prune them.
5. UI configuration is limited to declared fields, controls, layouts, copy,
   and presentation rules. Workflow configuration is limited to declared
   states, transitions, guards, roles, and Kernel operations.
6. Preview uses the authoritative compiler/validator path without persistence
   and exposes the normalized effective Blueprint, diagnostics, assumptions,
   exclusions, and a semantic diff from the preceding version.
7. Blueprint Approval is a separate explicit action over one immutable version
   and its content identity. Repair, normalization changes, and edits cannot
   inherit prior approval.
8. Schema validity does not prove business correctness. Executable retail and
   cafe scenarios must test workflow states, stock effects, ledger balance, and
   reset behavior.

## Unresolved questions

- Which canonical schema dialect and project-owned schema vocabulary will the
  Business Blueprint use?
- What is the exact shape and name of the interview response model, and how are
  source answers, uncertainty, assumptions, and sensitive fields represented?
- Which normalization changes are purely presentational, and which must create
  a new Draft Blueprint version?
- What stable diagnostic taxonomy will span translation, schema, references,
  policy, compilation, and scenario validation?
- Which UI controls, layouts, and rule effects are in the v1 allowlist?
- Which workflow states, guards, operations, error paths, and compensation or
  reversal semantics are in the v1 allowlist?
- Is Blueprint identity a content hash, a monotonic version, or both?
- What owner-facing semantic diff is sufficient to make approval informed
  without requiring the owner to inspect raw JSON?

## Evidence-backed recommendation

Adopt an intent-compiler contract, without yet selecting its implementation
stack:

```text
Owner Interview answers + provenance
  -> schema-constrained Intent Brief
  -> independent parse and validation
  -> deterministic normalization
  -> immutable Draft Blueprint
  -> canonical schema + reference + business-policy validation
  -> deterministic compilation to an Effective Blueprint
  -> side-effect-free preview + semantic diff + diagnostics
  -> explicit approval of exact version/content identity
  -> Business Kernel provisioning and execution
```

Use separate, closed schemas for conversational interpretation, canonical
Blueprint data, UI metadata, and workflow metadata. Provide explicit unknown
and unsupported outcomes, validate every cross-reference, and let only the
Business Kernel own authorization, state transitions, stock arithmetic, ledger
posting, and approval truth. The evidence strongly supports this layered
contract; it does not yet justify a final vendor, framework, or runtime choice.
