# Complete the v1 ubiquitous language

Type: grilling  
Status: claimed  
Blocked by: None

## Question

Which precise canonical terms and boundaries should the v1 specification use
for Capability, Record, Workflow, Role, Evidence, Tenant, Location, Order,
Payment, Ledger Entry, Stock Movement, and Business Event, extending
`CONTEXT.md` without adding implementation detail?

## Answer

This ticket remains claimed while its terms are resolved one at a time.

### Capability

A reusable, versioned business ability provided by the Business Kernel and
selected and configured by a Business Blueprint. It may shape records,
workflows, roles, interfaces, reports, and governed business actions, but it is
neither tenant-specific code nor an entire vertical application.

_Avoid_: Module, feature, app, plugin, tenant code

### Record

A durable, tenant-scoped business object recognized by an enabled Capability
and governed through a defined lifecycle. It may appear through many
interfaces, but it is not a form, screen, report row, transient agent message,
or derived view.

_Avoid_: Document, row, form, screen, saved data

### Workflow

A versioned business progression selected or configured by a Business
Blueprint, declaring how one or more Records may move through defined states
and which governed business actions may occur at each transition. The Business
Kernel enforces it; it is not a screen sequence, checklist, automation script,
agent plan, or arbitrary executable process.

_Avoid_: Process, flow, automation, checklist, agent plan

### Role

A named, Blueprint-defined bundle of business responsibilities, permitted
governed actions, and scope, assignable to one or more business participants.
It may shape interfaces, Evidence duties, and Workflow participation, but it is
not a person, login account, job title, permission flag, or authorization
implementation.

_Avoid_: User, account, job title, permission set, profile

### Evidence

A durable, attributable fact or artifact that supports a governed claim,
decision, action, or Workflow transition, with its origin and time preserved.
It may consist of or reference Records, observations, tests, or explicit
reviewer decisions, but it is not an AI assertion, operational trace, UI
notification, or report by itself.

_Avoid_: Proof, log, attachment, note, AI output

### Tenant

The top-level governed ownership and isolation boundary for one operating
business, within which its Business Blueprint versions, Records, Roles,
Workflows, Evidence, and Locations belong. It is not a customer account, legal
entity, Location, database, deployment, or vertical application.

_Avoid_: Customer, account, organization, workspace, database

### Location

A named operational boundary within a Tenant to which business activity,
Roles, Records, stock, cash, or service may be scoped. It may represent a shop,
cafe, warehouse, or other operating point, but it is not merely an address, a
Tenant, a department, a storage bin, or a device.

_Avoid_: Branch, site, outlet, warehouse, address

### Order

A tenant-scoped Record of an accepted customer request for specified goods or
services, quantities, prices, and allowed choices, governed from acceptance
through fulfillment or cancellation. It establishes commercial and fulfillment
intent but is not a cart, quote, invoice, Payment, Kitchen Ticket, Purchase
Order, or Stock Movement.

_Avoid_: Sale, cart, invoice, Kitchen Ticket, Purchase Order

### Payment

A tenant-scoped Record of a governed transfer of monetary value between
parties, preserving its amount, currency, direction, method, effective time,
and any allocation to an obligation. It is not a payment promise or intent,
invoice, receipt artifact, cash-drawer action, or Ledger Entry.

_Avoid_: Receipt, transaction, payment intent, cash entry, Ledger Entry

## Current term

**Ledger Entry** — awaiting Botan's answer to the next one-question-at-a-time
domain-modeling decision.
