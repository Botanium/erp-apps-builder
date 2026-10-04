"use client";

import { useState, type FormEvent } from "react";
import type { Order, ShopState } from "@/lib/domain";
import type { CommandDraft } from "./workspace-cards";
import { Icon } from "./icons";

type Props = {
  order: Order;
  state: ShopState;
  busy: boolean;
  onPropose: (command: CommandDraft, title: string, details: string[]) => void;
};

const exclusions =
  "Paid refunds, damaged goods, missing or partial returns, and redelivery are not supported here. Do not record those as a full saleable return.";

export function OrderExceptions({ order, state, busy, onPropose }: Props) {
  const [showFailure, setShowFailure] = useState(false);
  const [allSaleable, setAllSaleable] = useState(false);
  const unpaidCOD =
    order.paymentMethod === "COD" && order.paymentStatus === "due";
  const money = (minor: number) =>
    `${(minor / 10 ** state.currencyDecimals).toFixed(state.currencyDecimals)} ${state.currency}`;

  function reviewFailure(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const reference = String(
      new FormData(event.currentTarget).get("reference") || ""
    ).trim();
    if (!reference || !unpaidCOD || order.status !== "dispatched") return;
    onPropose(
      {
        type: "order.delivery-failed",
        payload: { orderId: order.id, reference },
      },
      "Record unsuccessful delivery",
      [
        `Order: ${order.id} · ${order.customer}`,
        "Status: dispatched → delivery failed.",
        "Stock does not increase. The goods have not yet been recorded as physically returned.",
        `COD remains due: ${money(order.totalMinor)}. This is not collection, remittance, cancellation, or a refund.`,
        `Failure evidence: ${reference}`,
        exclusions,
      ]
    );
  }

  function reviewReturn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const reference = String(
      new FormData(event.currentTarget).get("reference") || ""
    ).trim();
    if (
      !reference ||
      !allSaleable ||
      !unpaidCOD ||
      order.status !== "delivery-failed"
    )
      return;
    onPropose(
      {
        type: "order.return-received",
        payload: { orderId: order.id, condition: "all-saleable", reference },
      },
      "Receive full saleable return",
      [
        `Order: ${order.id} · ${order.customer}`,
        "You confirm that every original ordered unit has physically returned and is saleable.",
        ...order.lines.map((line) => {
          const product = state.products.find(
            (item) => item.id === line.productId
          );
          return `${line.quantity} × ${product?.name || line.productId}: on hand ${product?.stock ?? "unknown"} → ${product ? product.stock + line.quantity : "unknown"}.`;
        }),
        `Status: delivery failed → returned. Outstanding COD: ${money(order.totalMinor)} → ${money(0)} (not due).`,
        "Restores these units once. No cash collection, remittance, refund, or courier-fee entry is created.",
        `Return receipt evidence: ${reference}`,
        exclusions,
      ]
    );
  }

  if (order.status === "returned")
    return (
      <div className="order-exception-panel">
        <p className="verified-note">
          <Icon name="check" size={15} /> Full saleable return recorded. No COD
          is due.
        </p>
        <p className="field-help">
          The original order amount is preserved for history. No money was
          collected, remitted, or refunded by this return.
        </p>
        <p className="field-help">{exclusions}</p>
      </div>
    );
  if (order.status === "delivery-failed" && unpaidCOD)
    return (
      <form className="order-exception-panel" onSubmit={reviewReturn}>
        <h3>Goods back? Count and check them first.</h3>
        <p className="field-help">
          Unsuccessful delivery did not restore stock. This form is only for the
          physical return of every original unit in saleable condition.
        </p>
        <ul className="simple-list">
          {order.lines.map((line) => (
            <li key={line.productId}>
              <span>
                {state.products.find((product) => product.id === line.productId)
                  ?.name || line.productId}
              </span>
              <strong>{line.quantity} units to return</strong>
            </li>
          ))}
        </ul>
        <label className="return-consent">
          <input
            type="checkbox"
            checked={allSaleable}
            onChange={(event) => setAllSaleable(event.target.checked)}
            required
          />
          I confirm all original goods have physically returned, been counted,
          and are saleable.
        </label>
        <label>
          Return receipt evidence
          <input
            name="reference"
            required
            maxLength={500}
            placeholder="Who received and inspected all goods, with reference"
          />
        </label>
        <p className="inline-warning">{exclusions}</p>
        <button
          className="button primary small"
          disabled={busy || !allSaleable}
        >
          Review full saleable return <Icon name="arrow" size={16} />
        </button>
      </form>
    );
  if (order.status !== "dispatched") return null;
  if (!unpaidCOD)
    return (
      <p className="field-help">
        Unsuccessful-delivery and saleable-return records are available only for
        unpaid COD orders. {exclusions}
      </p>
    );
  return (
    <div className="order-exception-panel">
      <button
        className="text-button"
        type="button"
        disabled={busy}
        aria-expanded={showFailure}
        onClick={() => setShowFailure(!showFailure)}
      >
        Record delivery failed
      </button>
      {showFailure ? (
        <form onSubmit={reviewFailure}>
          <p className="field-help">
            Record the unsuccessful attempt. Goods remain out of stock until a
            separate full saleable physical return is confirmed.
          </p>
          <label>
            Failure evidence
            <input
              name="reference"
              required
              maxLength={500}
              placeholder="Courier report or customer contact, with reference"
            />
          </label>
          <p className="field-help">{exclusions}</p>
          <button className="button secondary small" disabled={busy}>
            Review unsuccessful delivery <Icon name="arrow" size={16} />
          </button>
        </form>
      ) : null}
    </div>
  );
}
