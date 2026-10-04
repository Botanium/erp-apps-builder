# Shop Operations

The owner's record of catalog items, physical stock, supplier receipts, customer orders and manually observed money events.

## Language

**Product**:
A catalog identity with a current selling price; an existing order retains the selling price recorded when that order was created.
_Avoid_: Stock, purchase line

**On-hand stock**:
The saleable physical units held by the shop, including units reserved for orders but not yet dispatched.
_Avoid_: Available stock

**Available stock**:
On-hand stock less units reserved for orders.
_Avoid_: On-hand stock

**Physical count**:
An owner-confirmed count of saleable on-hand units, supported by a reason or evidence note; it is not a supplier receipt or an accounting valuation.
_Avoid_: Purchase, automatic reconciliation

**Purchase**:
The owner's record of goods ordered from a supplier; it does not establish that any goods have arrived or that the supplier was paid.
_Avoid_: Receipt, supplier payment

**Receipt**:
An owner-confirmed arrival of specific quantities from a purchase, supported by evidence.
_Avoid_: Purchase, expected delivery

**Unsuccessful delivery**:
An owner-recorded failed delivery attempt for a dispatched unpaid COD order; the goods have not thereby returned to the shop.
_Avoid_: Cancellation, return receipt

**Saleable return receipt**:
An owner-confirmed physical return of all goods from an unsuccessful unpaid COD delivery in saleable condition.
_Avoid_: Refund, failed delivery

**COD collection**:
Cash the owner records as collected from the customer after delivery.
_Avoid_: Courier remittance, bank verification

**COD remittance**:
Collected cash the owner records as received from the collector or courier.
_Avoid_: Collection, accounting settlement
