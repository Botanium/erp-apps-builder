# 08 — Execute cafe order-to-kitchen reuse

**What to build:** Fictitious cafe participants can use the same shared commercial, inventory, cash, and ledger behavior as retail while Kitchen Operations adds only the accepted-to-fulfilled preparation progression and governed ingredient-consumption request.

**Blocked by:** 07 — Execute the retail Golden Transaction.

**Status:** ready-for-agent

- [ ] Cafe pins the same exact Party Registry, Catalog, Inventory, Ordering, Sales, Payment, Cash, and Ledger Capability versions and governed-action meanings proven by retail.
- [ ] Catalog configuration defines a USD 8.00 Cortado using 18 g beans and 120 ml milk plus a USD 1.00 Extra Shot Modifier using 9 g beans, with frozen requirements on the accepted Order.
- [ ] Ordinary governed receiving admits 1,000 g beans at USD 0.02 per gram and 2,000 ml milk at USD 0.01 per millilitre, debiting Inventory and crediting Accounts Payable USD 40.00.
- [ ] One USD 9.00 Cortado with Extra Shot creates an Order and Kitchen Ticket with accepted, preparing, ready, and fulfilled progression.
- [ ] Accepted, preparing, and ready states create no ingredient consumption, Sale, Payment, Stock Movement, or ledger effect.
- [ ] First fulfilled consumes exactly 27 g beans and 120 ml milk and atomically records a USD 9.00 commercial Posting Set and USD 1.74 inventory-cost Posting Set; repeat fulfillment creates no duplicate effect.
- [ ] A separate full USD 9.00 cash Payment closes the receivable and reconciles Cash Position to the Cash ledger balance.
- [ ] Final observations show 973 g beans at USD 19.46, 1,880 ml milk at USD 18.80, Inventory USD 38.26, Cash USD 9.00 debit, Accounts Receivable zero, Accounts Payable USD 40.00 credit, Sales Revenue USD 9.00 credit, Cost of Goods Sold USD 1.74 debit, and trial balance USD 49.00 debit and credit.
- [ ] Tables, reservations, delivery, tips, loyalty, and advanced recipe costing remain absent, and no cafe label or tenant-specific code selects shared business behavior.
- [ ] Public-behavior tests begin red and prove kitchen-specific progression plus reuse of already-working shared Capability semantics.
