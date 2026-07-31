# Adaptive Business OS

The domain language for describing how owner intent becomes a governed, reviewable business operating experience without creating a separate application for every customer.

## Language

**Owner Interview**:
A guided business-discovery conversation whose owner-accepted answers become inputs to a proposed Business Blueprint.
_Avoid_: Prompt, requirements chat, app request

**Business Blueprint**:
A versioned, owner-reviewable description of one business's capabilities, roles, workflows, records, evidence rules, and experience.
_Avoid_: App spec, generated app, customer fork

**Draft Blueprint**:
A Business Blueprint version that remains under owner review and is not authorized to provision or update a Sandbox Experience.
_Avoid_: Proposed app, saved interview, pending system

**Approved Blueprint**:
A specific Business Blueprint version explicitly accepted by the owner and authorized to provision or update a Sandbox Experience.
_Avoid_: Finalized interview, confirmed choices, active prompt

**Blueprint Approval**:
The explicit owner decision that accepts one specific Draft Blueprint version.
_Avoid_: Interview completion, preview viewing, option selection

**Business Kernel**:
The governed business capabilities shared by every supported Business Blueprint rather than rebuilt for each business.
_Avoid_: Shared kernel, ERP core, base app

**Capability**:
A reusable, versioned business ability provided by the Business Kernel and selected and configured by a Business Blueprint. It may shape records, workflows, roles, interfaces, reports, and governed business actions, but it is neither tenant-specific code nor an entire vertical application.
_Avoid_: Module, feature, app, plugin, tenant code

**Record**:
A durable, tenant-scoped business object recognized by an enabled Capability and governed through a defined lifecycle. It may appear through many interfaces, but it is not a form, screen, report row, transient agent message, or derived view.
_Avoid_: Document, row, form, screen, saved data

**Workflow**:
A versioned business progression selected or configured by a Business Blueprint, declaring how one or more Records may move through defined states and which governed business actions may occur at each transition. The Business Kernel enforces it; it is not a screen sequence, checklist, automation script, agent plan, or arbitrary executable process.
_Avoid_: Process, flow, automation, checklist, agent plan

**Role**:
A named, Blueprint-defined bundle of business responsibilities, permitted governed actions, and scope, assignable to one or more business participants. It may shape interfaces, Evidence duties, and Workflow participation, but it is not a person, login account, job title, permission flag, or authorization implementation.
_Avoid_: User, account, job title, permission set, profile

**Evidence**:
A durable, attributable fact or artifact that supports a governed claim, decision, action, or Workflow transition, with its origin and time preserved. It may consist of or reference Records, observations, tests, or explicit reviewer decisions, but it is not an AI assertion, operational trace, UI notification, or report by itself.
_Avoid_: Proof, log, attachment, note, AI output

**Tenant**:
The top-level governed ownership and isolation boundary for one operating business, within which its Business Blueprint versions, Records, Roles, Workflows, Evidence, and Locations belong. It is not a customer account, legal entity, Location, database, deployment, or vertical application.
_Avoid_: Customer, account, organization, workspace, database

**Governed Configuration**:
AI-proposed Business Blueprint content constrained by Configuration Schemas and validated for execution by the Business Kernel.
_Avoid_: Generated code, prompt logic, tenant fork

**Configuration Schema**:
A versioned contract defining the structures and values allowed in Governed Configuration.
_Avoid_: Prompt format, arbitrary JSON, generated model

**Sandbox Experience**:
A non-production expression of a Business Blueprint using fictitious data for owner review and acceptance.
_Avoid_: Production tenant, live system, customer environment

**Reference Vertical Slice**:
An executable, non-production proof that spans Owner Interview, Blueprint Approval, both Sandbox Experiences, and their required business invariants.
_Avoid_: Clickable concept, production alpha, MVP

**Golden Transaction**:
The v1 retail proof path from purchase through receipt, stock, sale, payment, and a balanced ledger.
_Avoid_: Happy path, checkout demo, sales flow

**Menu Item**:
An item offered for ordering in a cafe Sandbox Experience, including the choices that may accompany it.
_Avoid_: Product, stock item, dish record

**Modifier**:
An allowed variation or add-on selected for a Menu Item as part of an Order.
_Avoid_: Option, customization, extra

**Kitchen Ticket**:
The cafe fulfillment record that carries ordered Menu Items through accepted, preparing, ready, and fulfilled states.
_Avoid_: Order, invoice, kitchen note

**Ingredient Consumption**:
The reduction in ingredient stock attributable to fulfilled Menu Items.
_Avoid_: Wastage, stock adjustment, purchase usage
