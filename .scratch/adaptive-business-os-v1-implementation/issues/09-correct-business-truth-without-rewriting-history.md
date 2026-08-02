# 09 — Correct business truth without rewriting history

**What to build:** Authorized fictitious participants can correct accepted retail and cafe effects through linked, forward-only Reversal, refund, and physical-return actions while original business truth remains immutable and every compensating stock or accounting effect stays explicit.

**Blocked by:** 07 — Execute the retail Golden Transaction; 08 — Execute cafe order-to-kitchen reuse.

**Status:** ready-for-agent

- [ ] A Commercial Sale Reversal creates a new attributable Business Event and equal-and-opposite revenue and receivable entries at the original accounts, amounts, currency, dimensions, and value, with no stock movement by itself.
- [ ] An outbound cash refund is a separate Payment action that debits Accounts Receivable and credits Cash and never implies a physical return.
- [ ] An accepted physical return or restoration is a separate governed stock action that moves the original issued quantity and value back to the declared Location and debits Inventory while crediting Cost of Goods Sold.
- [ ] A Supplier Receipt Reversal separately moves the original quantity and value back to the supplier boundary and debits Accounts Payable while crediting Inventory.
- [ ] Cafe Sale Reversal or refund never restores consumed ingredients automatically; any permitted ingredient restoration requires its own attributable physical action.
- [ ] Every correction links to the exact original Business Event and effect group while preserving the original Record, Event, Stock Movement, Posting Set, Ledger Entry, Payment, and Evidence history unchanged.
- [ ] The original actor cannot be the sole Reversal reviewer, and all Role, Location, Evidence, policy, baseline, and separation-of-duty checks are re-evaluated by the Business Kernel.
- [ ] Corrections preserve Posting Set balance, non-negative stock, moving-average value, Inventory control, Payment residual, Cash Position, and causation completeness after every accepted action.
- [ ] Unsupported, stale, excessive, duplicate, or unauthorized correction attempts reject atomically and create no balancing, repair, or partial effect.
- [ ] Public-behavior tests demonstrate each distinct correction meaning and prove that cancellation, Reversal, refund, and return are never conflated.
