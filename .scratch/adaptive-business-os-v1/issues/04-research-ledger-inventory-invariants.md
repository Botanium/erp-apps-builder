# Research ledger and inventory invariants

Type: research
Status: claimed
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
sold, but it does not prescribe the software controls. Ticket 09 must still
approve the proposed v1 posting policy, costing default, precision, and reversal
semantics before this research ticket is resolved.
