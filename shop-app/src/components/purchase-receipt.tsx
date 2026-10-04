"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { Purchase, ShopState } from "@/lib/domain";
import type { CommandDraft } from "./workspace-cards";
import { Icon } from "./icons";

type Props = {
  purchase: Purchase;
  state: ShopState;
  busy: boolean;
  onPropose: (command: CommandDraft, title: string, details: string[]) => void;
};

export function PurchaseReceipt({ purchase, state, busy, onPropose }: Props) {
  const [incoming, setIncoming] = useState<Record<string, string>>({});
  const receiptRevision = purchase.receipts?.at(-1)?.revision ?? 0;
  useEffect(() => setIncoming({}), [receiptRevision]);
  const money = (minor: number) =>
    `${(minor / 10 ** state.currencyDecimals).toFixed(state.currencyDecimals)} ${state.currency}`;
  const rows = purchase.lines.map((line) => {
    const received =
      line.receivedQuantity ??
      (purchase.status === "received" ? line.quantity : 0);
    const remaining = line.remainingQuantity ?? line.quantity - received;
    const raw = incoming[line.productId] ?? "0";
    const quantity = Number(raw);
    return {
      ...line,
      ordered: line.quantity,
      received,
      remaining,
      raw,
      quantity,
      name:
        state.products.find((product) => product.id === line.productId)?.name ||
        line.productId,
    };
  });
  const invalidQuantity = rows.some(
    (line) =>
      line.remaining > 0 &&
      (line.raw.trim() === "" ||
        !Number.isSafeInteger(line.quantity) ||
        line.quantity < 0 ||
        line.quantity > line.remaining)
  );
  const selected = rows.filter(
    (line) => line.quantity > 0 && line.remaining > 0
  );
  const open = purchase.status !== "received";

  function reviewReceipt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (invalidQuantity || !selected.length) return;
    const reference = String(
      new FormData(event.currentTarget).get("reference") || ""
    ).trim();
    if (!reference) return;
    onPropose(
      {
        type: "purchase.receive-lines",
        payload: {
          purchaseId: purchase.id,
          lines: selected.map((line) => ({
            productId: line.productId,
            quantity: line.quantity,
          })),
          reference,
        },
      },
      "Receive selected quantities",
      [
        `Purchase: ${purchase.id}`,
        ...selected.map(
          (line) =>
            `${line.name}: receive ${line.quantity} units. Received ${line.received} → ${line.received + line.quantity}; remaining ${line.remaining} → ${line.remaining - line.quantity}.`
        ),
        ...selected.map((line) => {
          const before = state.products.find(
            (product) => product.id === line.productId
          )?.stock;
          return `${line.name} on hand: ${before ?? "unknown"} → ${before === undefined ? "unknown" : before + line.quantity}. Reservations stay unchanged.`;
        }),
        `Human-entered receipt evidence: ${reference}`,
        "Only these quantities are added to stock. The purchase total is unchanged; this does not record or send a supplier payment.",
      ]
    );
  }

  return (
    <section className="purchase-record" aria-label={`Purchase ${purchase.id}`}>
      <div>
        <strong>
          {state.suppliers.find(
            (supplier) => supplier.id === purchase.supplierId
          )?.name || purchase.supplierId}
        </strong>
        <span className={`status-pill ${purchase.status}`}>
          {purchase.status.replaceAll("-", " ")}
        </span>
      </div>
      <p>
        {purchase.id} · {money(purchase.totalMinor)}
      </p>
      <div className="receipt-quantities">
        {rows.map((line) => (
          <div className="receipt-line" key={line.productId}>
            <strong>{line.name}</strong>
            <dl>
              <div>
                <dt>Ordered</dt>
                <dd>{line.ordered}</dd>
              </div>
              <div>
                <dt>Received</dt>
                <dd>{line.received}</dd>
              </div>
              <div>
                <dt>Remaining</dt>
                <dd>{line.remaining}</dd>
              </div>
            </dl>
          </div>
        ))}
      </div>
      {open ? (
        <form
          className="receipt-form"
          onSubmit={reviewReceipt}
          key={`${purchase.id}-${receiptRevision}`}
        >
          <p className="field-help">
            Enter only what physically arrived now. Zero means this receipt
            includes none of that product; nothing is assumed from the ordered
            quantity.
          </p>
          <div className="form-grid">
            {rows
              .filter((line) => line.remaining > 0)
              .map((line) => (
                <label key={line.productId}>
                  Incoming quantity — {line.name}
                  <input
                    type="number"
                    min="0"
                    max={line.remaining}
                    step="1"
                    value={line.raw}
                    onChange={(event) =>
                      setIncoming((current) => ({
                        ...current,
                        [line.productId]: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
              ))}
          </div>
          {invalidQuantity ? (
            <p className="inline-warning" role="alert">
              Incoming quantities must be whole numbers between zero and each
              product’s remaining quantity.
            </p>
          ) : null}
          <label>
            Receipt evidence
            <input
              name="reference"
              placeholder={
                state.synthetic
                  ? "Synthetic arrival and receiving note"
                  : "Arrival and receiving reference"
              }
              required
              maxLength={500}
            />
          </label>
          <button
            className="button secondary small"
            disabled={busy || invalidQuantity || !selected.length}
          >
            Review stock receipt <Icon name="arrow" size={15} />
          </button>
        </form>
      ) : (
        <p className="verified-note">
          <Icon name="check" size={15} /> All ordered quantities have a recorded
          stock receipt.
        </p>
      )}
      {purchase.receipts?.length ? (
        <details className="evidence-details">
          <summary>Receipt evidence ({purchase.receipts.length})</summary>
          {purchase.receipts.map((receipt, index) => (
            <div
              className="receipt-evidence"
              key={`${receipt.revision}-${index}`}
            >
              <strong>{receipt.reference}</strong>
              {receipt.lines.map((line) => (
                <p key={line.productId}>
                  {line.quantity} ×{" "}
                  {state.products.find(
                    (product) => product.id === line.productId
                  )?.name || line.productId}
                </p>
              ))}
              <small>
                Human-recorded · revision {receipt.revision} · {receipt.actor}
                {receipt.recordedAt
                  ? ` · ${receipt.recordedAt}`
                  : " · time not recorded"}
              </small>
            </div>
          ))}
        </details>
      ) : purchase.receiptReference ? (
        <p className="field-help">
          Legacy receipt evidence: {purchase.receiptReference}. Individual
          receipt events and times were not recorded.
        </p>
      ) : null}
    </section>
  );
}
