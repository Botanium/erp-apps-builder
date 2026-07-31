# Research ledger and inventory invariants

Type: research
Status: resolved
Blocked by: None

## Question

Which authoritative accounting sources, specifications, and well-maintained
source implementations establish the minimum double-entry, reversal,
stock-movement, costing, and reconciliation invariants required for the Golden
Transaction and cafe Ingredient Consumption proof?

## Evidence expected

A cited research note based on accounting standards, official documentation,
specifications, or maintained source implementations.

## Answer

Evidence is documented in
[Ledger and inventory invariants for the v1 proof](../research/04-ledger-inventory-invariants.md).

The sources support a narrow kernel contract: balanced and atomic postings,
immutable posted records corrected by linked reversals, idempotent business
events, independently recomputable stock quantity and value, explicit payment
reconciliation, and a whole-sandbox reset. IAS 2 supports consistent FIFO or
weighted-average inventory costing and expense recognition when inventory is
sold, but it does not prescribe the software controls. Ticket 09 will approve
or replace the proposed v1 posting policy, costing default, precision, and
reversal semantics.

## Review

Resolved on 2026-07-31 after checking the central claims against IFRS
Foundation IAS 2 and first-party Modern Treasury, TigerBeetle, and Odoo
documentation. The note correctly separates accounting treatment from
engineering controls: IAS 2 supports cost formulas and expense recognition,
while balance enforcement, atomicity, idempotency, immutability, reconciliation,
and sandbox reset are proposed kernel safeguards evidenced by maintained
implementations. The exact v1 accounting policy remains an owner decision in
the financial, stock, and audit invariants ticket.
