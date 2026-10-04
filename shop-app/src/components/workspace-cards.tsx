"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import type { Channel, Command, Order, ShopState } from "@/lib/domain";
import { Icon, type IconName } from "./icons";
import { InventoryProduct } from "./inventory-product";
import { PurchaseReceipt } from "./purchase-receipt";
import { OrderExceptions } from "./order-exceptions";

export type CardSpec = {
  type:
    | "overview"
    | "products"
    | "order-intake"
    | "order"
    | "purchase"
    | "money"
    | "setup"
    | "activity";
  title?: string;
  entityId?: string;
};
export type CommandDraft = {
  [K in Command["type"]]: Omit<
    Extract<Command, { type: K }>,
    "idempotencyKey" | "expectedRevision"
  >;
}[Command["type"]];
type CardProps = {
  card: CardSpec;
  state: ShopState;
  busy: boolean;
  onPropose: (command: CommandDraft, title: string, details: string[]) => void;
  onAsk: (text: string) => void;
};
const moneyFor = (state: ShopState) => (minor: number) =>
  `${(minor / 10 ** state.currencyDecimals).toFixed(state.currencyDecimals)} ${state.currency || "UNCONFIGURED"}`;
const toMinor = (amount: number, state: ShopState) =>
  Math.round(amount * 10 ** state.currencyDecimals);
const priceStep = (state: ShopState) => 1 / 10 ** state.currencyDecimals;
const id = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 12)}`;
const value = (data: FormData, key: string) =>
  String(data.get(key) || "").trim();
const number = (data: FormData, key: string) => Number(data.get(key));

function CardFrame({
  title,
  kicker,
  icon,
  children,
}: {
  title: string;
  kicker?: string;
  icon: IconName;
  children: ReactNode;
}) {
  return (
    <section className="work-card">
      <header className="work-card-header">
        <span className="work-card-icon">
          <Icon name={icon} />
        </span>
        <div>
          {kicker ? <span className="eyebrow">{kicker}</span> : null}
          <h2>{title}</h2>
        </div>
      </header>
      {children}
    </section>
  );
}

function ProductForm({
  state,
  onPropose,
  busy,
}: Pick<CardProps, "state" | "onPropose" | "busy">) {
  const money = moneyFor(state);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const payload = {
      id: id("product"),
      name: value(data, "name"),
      sku: value(data, "sku"),
      category: value(data, "category"),
      priceMinor: toMinor(number(data, "price"), state),
      lowStockAt: number(data, "low"),
    };
    onPropose({ type: "product.create", payload }, "Add this product", [
      `${payload.name} · ${payload.sku}`,
      `Category: ${payload.category}`,
      `Selling price: ${money(payload.priceMinor)}${state.synthetic ? " (synthetic units)" : ""}`,
      `Low-stock threshold: ${payload.lowStockAt}. Opening stock is zero; receive a purchase to add stock.`,
    ]);
  }
  return (
    <form className="context-form" onSubmit={submit}>
      <div className="form-intro">
        <h3>A new little thing</h3>
        <p>
          Create a product first, then receive stock from a supplier purchase.
        </p>
      </div>
      <div className="form-grid">
        <label>
          Product name
          <input
            name="name"
            placeholder="Pastel sketchbook"
            required
            maxLength={120}
          />
        </label>
        <label>
          SKU
          <input
            name="sku"
            placeholder="ART-SKETCH-01"
            required
            maxLength={60}
          />
        </label>
        <label>
          Category
          <input
            name="category"
            placeholder="Art & stationery"
            required
            maxLength={80}
          />
        </label>
        <label>
          Selling price · {state.currency}
          <input
            name="price"
            type="number"
            min={priceStep(state)}
            step={priceStep(state)}
            required
            placeholder="12.00"
          />
        </label>
        <label>
          Low-stock threshold
          <input
            name="low"
            type="number"
            min="0"
            step="1"
            defaultValue="3"
            required
          />
        </label>
      </div>
      <button className="button primary small" disabled={busy}>
        Review product <Icon name="arrow" size={16} />
      </button>
    </form>
  );
}

function OrderIntake({ state, onPropose, busy, onAsk }: CardProps) {
  const money = moneyFor(state);
  const [lines, setLines] = useState([
    { key: 0, productId: state.products[0]?.id || "", quantity: 1 },
  ]);
  const total = lines.reduce(
    (sum, line) =>
      sum +
      (state.products.find((p) => p.id === line.productId)?.priceMinor || 0) *
        line.quantity,
    0
  );
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const payload = {
      id: id("order"),
      customer: value(data, "customer"),
      channel: value(data, "channel") as Channel,
      address: value(data, "address"),
      phone: value(data, "phone"),
      lines: lines.map(({ productId, quantity }) => ({ productId, quantity })),
      paymentMethod: value(data, "payment") as "COD" | "online",
    };
    onPropose({ type: "order.create", payload }, "Record this customer order", [
      `Customer: ${payload.customer}`,
      `Manual source label: ${payload.channel} · ${payload.paymentMethod === "COD" ? "Cash on delivery" : "Online payment (manual record)"}`,
      ...lines.map(
        (line) =>
          `${line.quantity} × ${state.products.find((p) => p.id === line.productId)?.name}`
      ),
      `Total: ${money(total)}. No stock reserved and no payment collected yet.`,
      `Delivery: ${payload.address || "Not yet provided"} · ${payload.phone || "Contact not yet provided"}`,
    ]);
  }
  return (
    <CardFrame
      title="Let’s get the order right."
      kicker="CUSTOMER ORDER"
      icon="bag"
    >
      <form className="context-form" onSubmit={submit}>
        {!state.products.length ? (
          <div className="empty-state">
            Your catalog is empty. Add a product before recording an order.
            <br />
            <button
              type="button"
              className="text-button"
              disabled={busy}
              onClick={() => onAsk("Help me add my first product")}
            >
              Create your first product <Icon name="arrow" size={15} />
            </button>
          </div>
        ) : null}
        <p className="field-help">
          {state.synthetic
            ? "Synthetic customer details only. "
            : "Owner-entered records. "}
          Channel labels do not connect to Instagram, WhatsApp, or your website.
        </p>
        <div className="form-grid">
          <label>
            Customer name
            <input
              name="customer"
              required
              placeholder={
                state.synthetic ? "Sample customer" : "Customer name"
              }
              maxLength={120}
            />
          </label>
          <label>
            Order came from
            <select name="channel">
              <option>Instagram</option>
              <option>WhatsApp</option>
              <option>Website</option>
            </select>
          </label>
          <label>
            Delivery address{" "}
            <span className="optional">optional until reservation</span>
            <input
              name="address"
              placeholder={
                state.synthetic
                  ? "Synthetic delivery address"
                  : "Delivery address"
              }
              maxLength={250}
            />
          </label>
          <label>
            Contact <span className="optional">optional until reservation</span>
            <input
              name="phone"
              placeholder={
                state.synthetic ? "DEMO-CONTACT" : "Phone or contact reference"
              }
              maxLength={80}
            />
          </label>
          <label>
            Payment method
            <select name="payment">
              <option value="COD">Cash on delivery</option>
              <option value="online">Online · manually recorded</option>
            </select>
          </label>
        </div>
        <fieldset className="line-items">
          <legend>The little things they picked</legend>
          {lines.map((line, index) => (
            <div className="line-item" key={line.key}>
              <label>
                Product
                <select
                  value={line.productId}
                  onChange={(event) =>
                    setLines((current) =>
                      current.map((item, i) =>
                        i === index
                          ? { ...item, productId: event.target.value }
                          : item
                      )
                    )
                  }
                >
                  {state.products.map((product) => (
                    <option
                      value={product.id}
                      key={product.id}
                      disabled={lines.some(
                        (other, otherIndex) =>
                          otherIndex !== index && other.productId === product.id
                      )}
                    >
                      {product.name} · {product.stock - product.reserved}{" "}
                      available
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Quantity
                <input
                  type="number"
                  min="1"
                  max="10000"
                  step="1"
                  value={line.quantity}
                  required
                  onChange={(event) =>
                    setLines((current) =>
                      current.map((item, i) =>
                        i === index
                          ? { ...item, quantity: Number(event.target.value) }
                          : item
                      )
                    )
                  }
                />
              </label>
              {lines.length > 1 ? (
                <button
                  className="icon-button"
                  type="button"
                  aria-label={`Remove item ${index + 1}`}
                  onClick={() =>
                    setLines((current) => current.filter((_, i) => i !== index))
                  }
                >
                  <Icon name="close" size={16} />
                </button>
              ) : null}
            </div>
          ))}
          <button
            className="text-button"
            type="button"
            disabled={lines.length >= state.products.length}
            onClick={() =>
              setLines((current) => [
                ...current,
                {
                  key: Date.now(),
                  productId:
                    state.products.find(
                      (product) =>
                        !current.some((line) => line.productId === product.id)
                    )?.id || "",
                  quantity: 1,
                },
              ])
            }
          >
            <Icon name="plus" size={16} /> Add another item
          </button>
        </fieldset>
        <div className="form-total">
          <span>
            Order total{" "}
            <small>
              {state.synthetic
                ? "synthetic units"
                : "owner-configured currency"}
            </small>
          </span>
          <strong>{money(total)}</strong>
        </div>
        <button
          className="button primary small"
          disabled={busy || !state.products.length}
        >
          Review order <Icon name="arrow" size={16} />
        </button>
      </form>
    </CardFrame>
  );
}

function OrderRecord({
  order,
  state,
  onPropose,
  busy,
  onAsk,
}: { order: Order } & Omit<CardProps, "card">) {
  const money = moneyFor(state);
  const [expanded, setExpanded] = useState(false);
  const [reference, setReference] = useState("");
  useEffect(() => setReference(""), [order.status]);
  const awaitingOnline =
    order.paymentMethod === "online" &&
    !["confirmed", "settled"].includes(order.paymentStatus);
  const nextAction = {
    draft: "reserve",
    reserved: "pack",
    packed: "dispatch",
    dispatched: "deliver",
  }[order.status as "draft" | "reserved" | "packed" | "dispatched"];
  const needsReference = nextAction === "dispatch" || nextAction === "deliver";
  const missingDetails = !order.address || !order.phone;
  const shortage = order.lines.some((line) => {
    const product = state.products.find((p) => p.id === line.productId);
    return !product || product.stock - product.reserved < line.quantity;
  });
  const actionLabel = {
    reserve: "Reserve stock",
    pack: "Mark packed",
    dispatch: "Record dispatch",
    deliver: "Record delivery",
  }[nextAction || "reserve"];
  function next() {
    if (!nextAction) return;
    const payload = {
      orderId: order.id,
      ...(needsReference ? { reference } : {}),
    };
    onPropose(
      { type: `order.${nextAction}`, payload } as CommandDraft,
      `${actionLabel} · ${order.id}`,
      [
        `Customer: ${order.customer}`,
        `Current status: ${order.status} → ${nextAction === "reserve" ? "reserved" : nextAction === "pack" ? "packed" : nextAction === "dispatch" ? "dispatched" : "delivered"}`,
        ...(needsReference ? [`Human-entered evidence: ${reference}`] : []),
        nextAction === "reserve"
          ? "Reserves available stock for this order. No shipment or external message is created."
          : "This is a manual record only, not courier or customer verification.",
      ]
    );
  }
  return (
    <div className={`order-record ${expanded ? "expanded" : ""}`}>
      <button
        className="order-summary"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <span className={`channel-symbol ${order.channel.toLowerCase()}`}>
          {order.channel === "Instagram"
            ? "ig"
            : order.channel === "WhatsApp"
              ? "wa"
              : "w"}
        </span>
        <span className="order-summary-main">
          <strong>{order.customer}</strong>
          <span>
            {order.id} · {order.channel} ·{" "}
            {order.lines.reduce((sum, line) => sum + line.quantity, 0)} items
          </span>
        </span>
        <span className="order-summary-end">
          <strong>{money(order.totalMinor)}</strong>
          <span className={`status-pill ${order.status}`}>{order.status}</span>
        </span>
        <Icon name="chevron" size={16} />
      </button>
      {expanded ? (
        <div className="order-detail">
          <ul className="simple-list">
            {order.lines.map((line, index) => (
              <li key={index}>
                <span>
                  {state.products.find((p) => p.id === line.productId)?.name ||
                    line.productId}{" "}
                  × {line.quantity}
                </span>
                <strong>{money(line.quantity * line.unitPriceMinor)}</strong>
              </li>
            ))}
          </ul>
          <div className="order-facts">
            <span>
              Payment{" "}
              <strong>
                {order.paymentMethod} · {order.paymentStatus}
              </strong>
            </span>
            <span>
              Delivery{" "}
              <strong>{order.address || "MISSING — add address"}</strong>
            </span>
            <span>
              Contact <strong>{order.phone || "MISSING — add contact"}</strong>
            </span>
          </div>
          {order.status === "draft" ? (
            <form
              className="details-form"
              onSubmit={(event) => {
                event.preventDefault();
                const data = new FormData(event.currentTarget);
                onPropose(
                  {
                    type: "order.details",
                    payload: {
                      orderId: order.id,
                      address: value(data, "address"),
                      phone: value(data, "phone"),
                    },
                  },
                  "Update delivery details",
                  [
                    order.id,
                    `Address: ${value(data, "address")}`,
                    `Contact: ${value(data, "phone")}`,
                  ]
                );
              }}
            >
              <div className="form-grid">
                <label>
                  Delivery address
                  <input
                    name="address"
                    defaultValue={order.address}
                    required
                    placeholder={
                      state.synthetic ? "Synthetic address" : "Delivery address"
                    }
                  />
                </label>
                <label>
                  Contact
                  <input
                    name="phone"
                    defaultValue={order.phone}
                    required
                    placeholder={
                      state.synthetic
                        ? "DEMO-CONTACT"
                        : "Phone or contact reference"
                    }
                  />
                </label>
              </div>
              <button className="button secondary small" disabled={busy}>
                Review delivery details
              </button>
            </form>
          ) : null}
          {order.status === "draft" && shortage ? (
            <p className="inline-warning">
              There is not enough available stock for this order.{" "}
              <button
                className="text-button"
                disabled={busy}
                onClick={() =>
                  onAsk("Help me restock products through a supplier purchase")
                }
              >
                Plan a purchase
              </button>
            </p>
          ) : null}
          {nextAction ? (
            <form
              className="next-action-form"
              onSubmit={(event) => {
                event.preventDefault();
                next();
              }}
            >
              {needsReference ? (
                <label>
                  Human-entered{" "}
                  {nextAction === "dispatch"
                    ? "courier / dispatch"
                    : "delivery"}{" "}
                  evidence
                  <input
                    value={reference}
                    onChange={(event) => setReference(event.target.value)}
                    required
                    minLength={3}
                    placeholder={
                      state.synthetic
                        ? "Synthetic reference and what was checked"
                        : "Reference and what was checked"
                    }
                    maxLength={250}
                  />
                </label>
              ) : null}
              <button
                className="button primary small"
                disabled={
                  busy ||
                  (nextAction === "reserve" && (missingDetails || shortage)) ||
                  (nextAction === "dispatch" && awaitingOnline)
                }
              >
                {actionLabel} <Icon name="arrow" size={16} />
              </button>
              {nextAction === "dispatch" && awaitingOnline ? (
                <p className="inline-warning">
                  Record online payment confirmation before dispatch.{" "}
                  <button
                    className="text-button"
                    type="button"
                    disabled={busy}
                    onClick={() => onAsk("Review online payment records")}
                  >
                    Review payment records
                  </button>
                </p>
              ) : null}
              {nextAction === "reserve" && missingDetails ? (
                <span className="field-help">
                  Add address and contact before reserving.
                </span>
              ) : null}
            </form>
          ) : (
            <p className="field-help">
              This order is {order.status}.{" "}
              {order.status === "delivered"
                ? "Payment evidence remains a separate step."
                : ""}
            </p>
          )}
          <OrderExceptions
            order={order}
            state={state}
            busy={busy}
            onPropose={onPropose}
          />
          {["draft", "reserved", "packed"].includes(order.status) &&
          ["due", "pending"].includes(order.paymentStatus) ? (
            <details className="evidence-details">
              <summary>Cancel this unpaid order</summary>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  const data = new FormData(event.currentTarget);
                  onPropose(
                    {
                      type: "order.cancel",
                      payload: {
                        orderId: order.id,
                        reference: value(data, "cancelReference"),
                      },
                    },
                    "Cancel this unpaid order",
                    [
                      `Order: ${order.id} · ${order.customer}`,
                      `Reason: ${value(data, "cancelReference")}`,
                      order.status === "draft"
                        ? "No stock has been reserved."
                        : "Reserved stock will be released back to availability.",
                      "This does not contact the customer. Only a separate unsuccessful unpaid-COD delivery can later receive a full saleable return. Paid refunds, damaged or partial returns, and redelivery are unsupported.",
                    ]
                  );
                }}
              >
                <label>
                  Cancellation reason
                  <input
                    name="cancelReference"
                    required
                    minLength={3}
                    placeholder="Reason for cancelling this order"
                  />
                </label>
                <button className="button secondary small" disabled={busy}>
                  Review cancellation
                </button>
              </form>
            </details>
          ) : null}
          {order.evidence.length ? (
            <details className="evidence-details">
              <summary>Recorded evidence ({order.evidence.length})</summary>
              {order.evidence.map((entry, index) => (
                <p key={index}>
                  <strong>{entry.action}</strong> · {entry.reference}
                  <br />
                  <small>Human-recorded · revision {entry.revision}</small>
                </p>
              ))}
            </details>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function PurchaseCard(props: CardProps) {
  const { state, busy, onPropose } = props;
  const money = moneyFor(state);
  const [supplierForm, setSupplierForm] = useState(false);
  function createPurchase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const payload = {
      id: id("purchase"),
      supplierId: value(data, "supplier"),
      lines: [
        {
          productId: value(data, "product"),
          quantity: number(data, "quantity"),
          unitCostMinor: toMinor(number(data, "cost"), state),
        },
      ],
      reference: value(data, "reference"),
    };
    onPropose(
      { type: "purchase.create", payload },
      "Record supplier purchase",
      [
        `Supplier: ${state.suppliers.find((s) => s.id === payload.supplierId)?.name}`,
        `${payload.lines[0].quantity} × ${state.products.find((p) => p.id === payload.lines[0].productId)?.name}`,
        `Unit cost: ${money(payload.lines[0].unitCostMinor)} · Total: ${money(payload.lines[0].quantity * payload.lines[0].unitCostMinor)}`,
        `Reference: ${payload.reference}`,
        "Stock remains unchanged until you separately record receipt. Nothing is sent to the supplier.",
      ]
    );
  }
  return (
    <CardFrame
      title="A little more on the shelf."
      kicker="SUPPLIER PURCHASES"
      icon="box"
    >
      <div className="context-form">
        <p className="field-help">
          Record a {state.synthetic ? "synthetic " : ""}purchase, then confirm
          receipt to make stock available. This does not place an order with a
          supplier.
        </p>
        {state.purchases.length ? (
          <div className="purchase-list">
            {state.purchases.map((purchase) => (
              <PurchaseReceipt
                key={purchase.id}
                purchase={purchase}
                state={state}
                busy={busy}
                onPropose={onPropose}
              />
            ))}
          </div>
        ) : null}
        <form onSubmit={createPurchase}>
          <h3>Plan a supplier purchase</h3>
          {!state.products.length ? (
            <p className="field-help">
              Add a product before planning its purchase.{" "}
              <button
                type="button"
                className="text-button"
                disabled={busy}
                onClick={() => props.onAsk("Help me add my first product")}
              >
                Create a product
              </button>
            </p>
          ) : null}
          {!state.suppliers.length ? (
            <p className="field-help">
              Add your first supplier below, then return to the purchase.
            </p>
          ) : null}
          <div className="form-grid">
            <label>
              Supplier
              <select name="supplier" required>
                {state.suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Product
              <select name="product" required>
                {state.products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} · {product.stock - product.reserved}{" "}
                    available
                  </option>
                ))}
              </select>
            </label>
            <label>
              Quantity
              <input
                name="quantity"
                type="number"
                min="1"
                step="1"
                required
                placeholder="10"
              />
            </label>
            <label>
              Unit cost · {state.currency}
              <input
                name="cost"
                type="number"
                min={priceStep(state)}
                step={priceStep(state)}
                required
                placeholder="4.00"
              />
            </label>
            <label className="full-width">
              Purchase reference
              <input
                name="reference"
                required
                minLength={3}
                placeholder={
                  state.synthetic
                    ? "Synthetic supplier quote or purchase note"
                    : "Supplier quote or purchase reference"
                }
              />
            </label>
          </div>
          <div className="form-actions">
            <button
              className="button primary small"
              disabled={
                busy || !state.suppliers.length || !state.products.length
              }
            >
              Review purchase <Icon name="arrow" size={16} />
            </button>
            <button
              className="text-button"
              type="button"
              onClick={() => setSupplierForm(!supplierForm)}
            >
              <Icon name="plus" size={15} /> Add supplier
            </button>
          </div>
        </form>
        {supplierForm || !state.suppliers.length ? (
          <form
            className="supplier-form"
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              const payload = {
                id: id("supplier"),
                name: value(data, "name"),
                contact: value(data, "contact"),
              };
              onPropose({ type: "supplier.create", payload }, "Add supplier", [
                payload.name,
                `Contact: ${payload.contact}`,
              ]);
            }}
          >
            <h3>New supplier</h3>
            <div className="form-grid">
              <label>
                Supplier name
                <input
                  name="name"
                  required
                  placeholder={
                    state.synthetic ? "Sample supplier" : "Supplier name"
                  }
                />
              </label>
              <label>
                Contact
                <input
                  name="contact"
                  required
                  placeholder={
                    state.synthetic ? "DEMO-SUPPLIER" : "Supplier contact"
                  }
                />
              </label>
            </div>
            <button className="button secondary small" disabled={busy}>
              Review supplier
            </button>
          </form>
        ) : null}
      </div>
    </CardFrame>
  );
}

function PaymentRecord({
  order,
  state,
  busy,
  onPropose,
}: { order: Order } & Pick<CardProps, "state" | "busy" | "onPropose">) {
  const money = moneyFor(state);
  const next =
    order.paymentMethod === "COD"
      ? ({ due: "collected", collected: "remitted" } as const)[
          order.paymentStatus as "due" | "collected"
        ]
      : ({ pending: "confirmed", confirmed: "settled" } as const)[
          order.paymentStatus as "pending" | "confirmed"
        ];
  return (
    <div className="payment-record">
      <div className="payment-record-heading">
        <div>
          <strong>{order.customer}</strong>
          <span>
            {order.id} · {order.paymentMethod}
          </span>
        </div>
        <div>
          <strong>{money(order.totalMinor)}</strong>
          {order.paymentStatus === "not-due" ? (
            <small className="closed-obligation-label">
              Original total · no COD due
            </small>
          ) : null}
          <span className="status-pill">{order.paymentStatus}</span>
        </div>
      </div>
      {next ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            onPropose(
              {
                type: "payment.record",
                payload: {
                  orderId: order.id,
                  status: next,
                  amountMinor: order.totalMinor,
                  reference: value(data, "reference"),
                },
              },
              `Record payment as ${next}`,
              [
                `Order: ${order.id}`,
                `Full amount: ${money(order.totalMinor)}${state.synthetic ? " (synthetic units)" : ""}`,
                `Status: ${order.paymentStatus} → ${next}`,
                `Human-entered evidence: ${value(data, "reference")}`,
                "No money moves through this app. This is not provider-confirmed payment or reconciliation.",
              ]
            );
          }}
        >
          <label>
            Evidence for “{next}”
            <input
              name="reference"
              required
              minLength={3}
              placeholder={
                order.paymentMethod === "COD"
                  ? "Courier collection / remittance reference"
                  : "Provider reference and verification note"
              }
            />
          </label>
          <button
            className="button secondary small"
            disabled={
              busy || (next === "collected" && order.status !== "delivered")
            }
          >
            Review {next} record
          </button>
          {next === "collected" && order.status !== "delivered" ? (
            <p className="field-help">
              Record delivery before cash collection.
            </p>
          ) : null}
        </form>
      ) : (
        <p className="verified-note">
          <Icon name="check" size={15} /> {order.paymentStatus} · human-recorded{" "}
          {state.synthetic ? "preview " : ""}evidence
        </p>
      )}
    </div>
  );
}

export function ContextCard(props: CardProps) {
  const { card, state, busy, onAsk, onPropose } = props;
  const money = moneyFor(state);
  const [addingProduct, setAddingProduct] = useState(false);
  if (state.setup.status === "unconfigured") return <SetupForm {...props} />;
  switch (card.type) {
    case "order-intake":
      return <OrderIntake {...props} />;
    case "products":
      return (
        <CardFrame
          title={card.title || "Good things on your shelves."}
          kicker="PRODUCTS & STOCK"
          icon="box"
        >
          <div className="product-list">
            {!state.products.length ? (
              <p className="empty-state">
                Your shelves start here. Add a product, then receive its opening
                stock through a purchase.
              </p>
            ) : null}
            {state.products.map((product, index) => (
              <InventoryProduct
                key={product.id}
                product={product}
                index={index}
                state={state}
                busy={busy}
                onPropose={onPropose}
              />
            ))}
          </div>
          <div className="card-footer">
            <span>Available = on hand − reserved</span>
            <button
              className="text-button"
              onClick={() => setAddingProduct(!addingProduct)}
            >
              <Icon name="plus" size={16} /> Add product
            </button>
          </div>
          {addingProduct || !state.products.length ? (
            <ProductForm state={state} busy={busy} onPropose={onPropose} />
          ) : null}
        </CardFrame>
      );
    case "order": {
      const orders = card.entityId
        ? state.orders.filter((order) => order.id === card.entityId)
        : state.orders;
      return (
        <CardFrame
          title={card.title || "Every order, a clear next step."}
          kicker="MANUALLY RECORDED ORDERS"
          icon="bag"
        >
          {orders.length ? (
            orders.map((order) => (
              <OrderRecord
                key={order.id}
                order={order}
                state={state}
                busy={busy}
                onPropose={onPropose}
                onAsk={onAsk}
              />
            ))
          ) : (
            <p className="empty-state">
              No orders here yet. Start with a customer order.
            </p>
          )}
          <div className="card-footer">
            <span>Delivery and payment are separate records.</span>
            <button
              className="text-button"
              disabled={busy}
              onClick={() => onAsk("Help me record a new customer order")}
            >
              <Icon name="plus" size={16} /> New order
            </button>
          </div>
        </CardFrame>
      );
    }
    case "purchase":
      return <PurchaseCard {...props} />;
    case "money":
      return (
        <CardFrame
          title="Keep the money story clear."
          kicker="MANUAL PAYMENT RECORDS"
          icon="bag"
        >
          <p className="card-intro">
            {state.synthetic
              ? "All amounts are synthetic DEMO units. "
              : `Amounts use your configured ${state.currency} currency. `}
            COD collection ≠ courier remittance. Online confirmation ≠
            settlement. Nothing here charges a card or checks a bank.
          </p>
          {state.orders
            .filter((order) => order.status !== "cancelled")
            .map((order) => (
              <PaymentRecord
                key={order.id}
                state={state}
                order={order}
                busy={busy}
                onPropose={onPropose}
              />
            ))}
        </CardFrame>
      );
    case "setup":
      return (
        <CardFrame
          title="Know what’s real. Know what’s next."
          kicker="WORKSPACE CAPABILITIES"
          icon="settings"
        >
          <div className="setup-grid">
            {[
              [
                "Workspace records",
                "AVAILABLE",
                state.synthetic
                  ? "Synthetic preview only. Confirmed changes are stored separately from the owner shop."
                  : "Owner shop records. Preview data is isolated and never imported.",
              ],
              [
                "Conversation guide",
                "LOCAL / RULE-BASED",
                "Responds to supported shop intents. No paid model is called.",
              ],
              [
                "Instagram · WhatsApp · Website",
                "NOT CONNECTED",
                "Manual order-source labels only. No messages or orders are imported.",
              ],
              [
                "Online payments & couriers",
                "NOT CONNECTED",
                "Human-entered evidence, not provider verification or money movement.",
              ],
              [
                "Own-business mode",
                state.mode === "shop" ? "OWNER WORKSPACE" : "SEPARATE SIGN-IN",
                state.mode === "shop"
                  ? `${state.setup.businessName} · ${state.currency} · ${state.currencyDecimals} decimal places. Deployment and human acceptance remain separate.`
                  : "Sign out, then use configured owner access to open an empty separate shop.",
              ],
            ].map(([title, status, detail]) => (
              <div key={title}>
                <strong>{title}</strong>
                <span className="status-pill">{status}</span>
                <p>{detail}</p>
              </div>
            ))}
          </div>
        </CardFrame>
      );
    case "activity":
      return (
        <CardFrame
          title="A clear trail of what changed."
          kicker="LOCAL AUDIT HISTORY"
          icon="history"
        >
          {state.audit.length ? (
            <ol className="audit-list">
              {state.audit
                .slice()
                .reverse()
                .slice(0, 15)
                .map((event) => (
                  <li key={event.revision}>
                    <span className="audit-dot">
                      <Icon name="check" size={12} />
                    </span>
                    <div>
                      <strong>{event.summary}</strong>
                      <span>
                        Revision {event.revision} · {event.action} ·{" "}
                        {event.actor}
                      </span>
                      <small>
                        {state.synthetic
                          ? "Human-recorded preview"
                          : "Human-recorded shop entry"}{" "}
                        · {event.entityId}
                      </small>
                    </div>
                  </li>
                ))}
            </ol>
          ) : (
            <p className="empty-state">
              No changes yet. Your confirmed actions will appear here.
            </p>
          )}
        </CardFrame>
      );
    case "overview": {
      const missing = state.orders.filter(
        (order) => order.status === "draft" && (!order.address || !order.phone)
      );
      const low = state.products.filter(
        (product) => product.stock - product.reserved <= product.lowStockAt
      );
      const unpaid = state.orders.filter(
        (order) =>
          !["cancelled", "returned"].includes(order.status) &&
          !["remitted", "settled", "not-due"].includes(order.paymentStatus)
      );
      return (
        <CardFrame
          title="Here’s a useful place to start."
          kicker="NEXT GOOD STEPS"
          icon="spark"
        >
          <div className="next-steps">
            {[
              {
                title: missing.length
                  ? `${missing.length} order${missing.length === 1 ? "" : "s"} need delivery details`
                  : "Move your orders forward",
                detail: missing.length
                  ? "An address and contact are needed before reserving stock."
                  : "Review reservation, packing, and delivery steps.",
                prompt: "Show my orders and their next steps",
                label: "Review orders",
              },
              {
                title: low.length
                  ? `${low.length} products are running low`
                  : "Plan your next stock purchase",
                detail:
                  "Record a supplier purchase and receive it before making new promises.",
                prompt:
                  "Help me create a supplier purchase and restock products",
                label: "Plan a purchase",
              },
              {
                title: `${unpaid.length} payment records need follow-through`,
                detail:
                  "Keep cash collection, remittance, and online settlement separate.",
                prompt: "Review COD and online payment records",
                label: "Review payments",
              },
            ].map((step, index) => (
              <div className="next-step" key={step.title}>
                <span className="step-number">0{index + 1}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.detail}</p>
                  <button
                    className="text-button"
                    disabled={busy}
                    onClick={() => onAsk(step.prompt)}
                  >
                    {step.label}
                    <Icon name="arrow" size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </CardFrame>
      );
    }
    default:
      return (
        <div className="error-box">
          This guide card is not supported. Your records have not changed.
        </div>
      );
  }
}

export function SetupForm({ state, busy, onPropose }: CardProps) {
  return (
    <CardFrame
      title="Make this space yours."
      kicker="EMPTY OWNER WORKSPACE"
      icon="leaf"
    >
      <form
        className="context-form"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const payload = {
            businessName: value(data, "businessName"),
            currency: value(data, "currency").toUpperCase(),
            currencyDecimals: number(data, "currencyDecimals") as 0 | 2 | 3,
          };
          onPropose(
            { type: "setup.configure", payload },
            "Set up your shop workspace",
            [
              `Business name: ${payload.businessName}`,
              `Currency: ${payload.currency} · ${payload.currencyDecimals} decimal places`,
              "This is a separate empty shop. No synthetic products, orders, or suppliers will be copied.",
              "Currency settings lock after business records are added. No integration or paid AI is enabled.",
            ]
          );
        }}
      >
        <p className="field-help">
          Start with your own business name and currency. These cannot be
          guessed, and preview data stays in the preview.
        </p>
        <div className="form-grid">
          <label className="full-width">
            Business name
            <input
              name="businessName"
              required
              maxLength={120}
              placeholder="Enter your business name"
              defaultValue={state.setup.businessName}
            />
          </label>
          <label>
            Currency code
            <input
              name="currency"
              required
              pattern="[A-Za-z]{3}"
              maxLength={3}
              placeholder="e.g. IQD or USD"
              style={{ textTransform: "uppercase" }}
            />
          </label>
          <label>
            Currency decimal places
            <select name="currencyDecimals" defaultValue="" required>
              <option value="" disabled>
                Choose explicitly
              </option>
              <option value="0">0 · whole units (e.g. 1200)</option>
              <option value="2">2 · hundredths (e.g. 12.00)</option>
              <option value="3">3 · thousandths (e.g. 1.200)</option>
            </select>
          </label>
        </div>
        <button className="button primary small" disabled={busy}>
          Review shop setup <Icon name="arrow" size={16} />
        </button>
      </form>
    </CardFrame>
  );
}
