# 07 — Execute the retail Golden Transaction

**What to build:** Fictitious Buyer, Receiver, and Retail Cashier participants can execute purchase, receipt, stock admission, customer Order, Sale fulfillment, cash Payment, and reconciliation through shared governed actions, producing exact independently recomputable stock, Cash, and balanced-ledger results.

**Blocked by:** 05 — Compile once and provision retail and cafe independently.

**Status:** ready-for-agent

- [ ] The retail target uses the exact Approved and Applied Blueprint, exact supported Capability versions, USD functional currency, normalized `each` stock unit, and the declared fictitious participant Roles and scopes.
- [ ] Confirming a Purchase Order for ten widgets at USD 5.00 each creates commercial intent only and no stock or ledger effect.
- [ ] Accepting the Supplier Receipt moves ten widgets from the supplier boundary to the retail Location and atomically debits Inventory 5,000 minor units and credits Accounts Payable 5,000.
- [ ] Accepting an Order for four widgets at USD 12.00 each creates customer and fulfillment intent only and no stock or ledger effect.
- [ ] First Sale fulfillment issues four widgets and atomically records a USD 48.00 commercial Posting Set plus a USD 20.00 inventory-cost Posting Set, each balanced and linked to the causing Business Event.
- [ ] Accepting the full USD 48.00 cash Payment debits Cash, credits Accounts Receivable, allocates the obligation, and leaves zero receivable residual.
- [ ] Final observations show six widgets, Inventory USD 30.00, Cash USD 48.00 debit, Accounts Receivable zero, Cost of Goods Sold USD 20.00 debit, Accounts Payable USD 50.00 credit, Sales Revenue USD 48.00 credit, and trial balance USD 98.00 debit and credit.
- [ ] Every Record, Event, Evidence reference, Stock Movement, Posting Set, Ledger Entry, and Payment retains exact Tenant, target, Location, generation, Applied Blueprint, causation, attribution, and version scope.
- [ ] On-hand quantity, moving-average value, Inventory control, Cash Position, Payment residual, and trial balance are independently recomputable from immutable effects rather than trusted derived totals.
- [ ] Public-behavior tests use fixed expected literals, begin red, and pass through the shared Kernel Interfaces without inspecting private arithmetic or raw storage.
