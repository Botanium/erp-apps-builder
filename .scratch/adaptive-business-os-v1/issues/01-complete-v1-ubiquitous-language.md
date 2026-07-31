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

## Current term

**Workflow** — awaiting Botan's answer to the next one-question-at-a-time
domain-modeling decision.
