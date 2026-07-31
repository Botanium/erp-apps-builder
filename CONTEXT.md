# Adaptive Business OS

The domain language for describing how owner intent becomes a governed, reviewable business operating experience without creating a separate application for every customer.

## Language

**Owner Interview**:
A guided business-discovery conversation whose owner-accepted answers become inputs to a proposed Business Blueprint.
_Avoid_: Prompt, requirements chat, app request

**Intent Brief**:
A versioned, owner-reviewable Record of the business intent captured by an Owner Interview, preserving accepted facts, unresolved questions, assumptions, constraints, sensitive-data classifications, and acceptance conditions together with their sources. It is input to Draft Blueprint generation but is neither a Business Blueprint, owner approval, executable configuration, nor authority for any Business Kernel action.
_Avoid_: Requirements document, prompt, transcript, app specification, Business Blueprint

**Intent State**:
A classification attached to each material statement in an Intent Brief that preserves whether and how its meaning is established without granting execution authority.
_Avoid_: Confidence score, AI certainty, completion status, validation result

**Sensitive Data Class**:
An owner-reviewed classification attached to every data category named in an Intent Brief that records the most restrictive permitted exposure boundary for its contents.
_Avoid_: Privacy level, permission, secrecy flag, compliance status, sensitivity score

**Assumption**:
An explicitly marked, source-attributed provisional proposition in an Intent Brief used to continue owner review while intent remains unconfirmed, preserving its rationale, affected scope, impact if wrong, and resolution condition.
_Avoid_: Default, inference, recommendation, placeholder, Confirmed fact

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

**Location**:
A named operational boundary within a Tenant to which business activity, Roles, Records, stock, cash, or service may be scoped. It may represent a shop, cafe, warehouse, or other operating point, but it is not merely an address, a Tenant, a department, a storage bin, or a device.
_Avoid_: Branch, site, outlet, warehouse, address

**Order**:
A tenant-scoped Record of an accepted customer request for specified goods or services, quantities, prices, and allowed choices, governed from acceptance through fulfillment or cancellation. It establishes commercial and fulfillment intent but is not a cart, quote, invoice, Payment, Kitchen Ticket, Purchase Order, or Stock Movement.
_Avoid_: Sale, cart, invoice, Kitchen Ticket, Purchase Order

**Payment**:
A tenant-scoped Record of a governed transfer of monetary value between parties, preserving its amount, currency, direction, method, effective time, and any allocation to an obligation. It is not a payment promise or intent, invoice, receipt artifact, cash-drawer action, or Ledger Entry.
_Avoid_: Receipt, transaction, payment intent, cash entry, Ledger Entry

**Ledger Entry**:
A tenant-scoped, immutable accounting Record that assigns one debit or credit amount in one currency to one ledger account as part of a balanced posting linked to a Business Event. It is not a Payment, invoice line, account balance, journal transaction, cash movement, or editable bookkeeping row.
_Avoid_: Journal, transaction, posting, line item, balance

**Stock Movement**:
A tenant-scoped, immutable inventory Record that transfers a positive quantity of one item or ingredient, in one normalized unit, from a source to a destination at an effective time and links the transfer to its causing Business Event. A source or destination may be a Tenant Location or an explicit supplier, customer, consumption, or adjustment boundary; it is not an on-hand balance, freehand stock edit, Order line, or Ledger Entry.
_Avoid_: Stock balance, adjustment, transfer, inventory row, Ledger Entry

**Business Event**:
An immutable, tenant-scoped fact recognized by the Business Kernel that a governed business occurrence happened, preserving its effective time, recorded time, responsible source, and causation. It is the causal source to which any resulting Record transitions, Stock Movements, and balanced Ledger Entries link, but it is not a command, request, UI action, agent trace, log message, or any of those resulting effects.
_Avoid_: Event log, command, action, webhook, trace

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
