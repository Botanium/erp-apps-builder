"use client";

import { useState, type FormEvent } from "react";
import type { Product, ShopState } from "@/lib/domain";
import type { CommandDraft } from "./workspace-cards";
import { Icon } from "./icons";

type Props = {
  product: Product;
  index: number;
  state: ShopState;
  busy: boolean;
  onPropose: (command: CommandDraft, title: string, details: string[]) => void;
};

export function InventoryProduct({
  product,
  index,
  state,
  busy,
  onPropose,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [counting, setCounting] = useState(false);
  const [countInput, setCountInput] = useState("");
  const factor = 10 ** state.currencyDecimals;
  const price = (minor: number) =>
    `${(minor / factor).toFixed(state.currencyDecimals)} ${state.currency}`;
  const available = product.stock - product.reserved;
  const countedStock = Number(countInput);
  const validCount =
    countInput.trim() !== "" &&
    Number.isSafeInteger(countedStock) &&
    countedStock >= 0;
  const belowReserved = validCount && countedStock < product.reserved;
  const delta = countedStock - product.stock;
  const signedDelta = validCount ? `${delta >= 0 ? "+" : ""}${delta}` : "—";

  function reviewEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const payload = {
      productId: product.id,
      name: String(data.get("name") || "").trim(),
      sku: String(data.get("sku") || "").trim(),
      priceMinor: Math.round(Number(data.get("price")) * factor),
    };
    onPropose({ type: "product.update", payload }, "Update product details", [
      `Product name: ${product.name} → ${payload.name}`,
      `SKU: ${product.sku} → ${payload.sku}`,
      `Selling price: ${price(product.priceMinor)} → ${price(payload.priceMinor)}`,
      "Existing order and purchase prices stay unchanged. New orders use the updated selling price.",
      "Product identity, category, stock, reservations, and low-stock threshold stay unchanged.",
    ]);
  }

  function reviewCount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validCount || belowReserved) return;
    const reference = String(
      new FormData(event.currentTarget).get("reference") || ""
    ).trim();
    if (!reference) return;
    onPropose(
      {
        type: "stock.adjust",
        payload: { productId: product.id, countedStock, reference },
      },
      "Record physical count",
      [
        `Product: ${product.name} · ${product.sku}`,
        `On-hand units: ${product.stock} → ${countedStock} (adjustment ${signedDelta})`,
        `Reserved units stay ${product.reserved}. Available units: ${available} → ${countedStock - product.reserved}.`,
        `Count reason / evidence: ${reference}`,
        "This records your physical count of saleable stock. It is not a supplier receipt, cost recalculation, or accounting valuation.",
      ]
    );
  }

  return (
    <section className="inventory-product" aria-label={product.name}>
      <div className="product-row">
        <span className={`product-art art-${index % 3}`}>
          <Icon name={index % 2 ? "leaf" : "box"} size={25} />
        </span>
        <span className="product-main">
          <strong>{product.name}</strong>
          <span>
            {product.sku} · {product.category}
          </span>
        </span>
        <span className="product-stock">
          <strong>{available} available</strong>
          <span>
            {product.stock} on hand · {product.reserved} reserved ·{" "}
            {price(product.priceMinor)}
          </span>
        </span>
        {available <= product.lowStockAt ? (
          <span
            className="low-stock-dot"
            title="At or below low-stock threshold"
            aria-label="Low stock"
          />
        ) : null}
      </div>
      <div className="inventory-actions">
        <button
          className="text-button"
          type="button"
          disabled={busy}
          aria-expanded={editing}
          onClick={() => setEditing(!editing)}
        >
          Edit product
        </button>
        <button
          className="text-button"
          type="button"
          disabled={busy}
          aria-expanded={counting}
          onClick={() => setCounting(!counting)}
        >
          Record physical count
        </button>
      </div>
      {editing ? (
        <form className="context-form inventory-form" onSubmit={reviewEdit}>
          <div className="form-intro">
            <h3>Edit this product</h3>
            <p>
              Update the catalog for future orders. Existing order prices are
              preserved.
            </p>
          </div>
          <div className="form-grid">
            <label>
              Product name
              <input
                name="name"
                defaultValue={product.name}
                required
                maxLength={120}
              />
            </label>
            <label>
              SKU
              <input
                name="sku"
                defaultValue={product.sku}
                required
                maxLength={60}
              />
            </label>
            <label>
              Selling price · {state.currency}
              <input
                name="price"
                type="number"
                min={1 / factor}
                step={1 / factor}
                defaultValue={(product.priceMinor / factor).toFixed(
                  state.currencyDecimals
                )}
                required
              />
            </label>
          </div>
          <div className="form-actions">
            <button className="button primary small" disabled={busy}>
              Review product changes <Icon name="arrow" size={16} />
            </button>
            <button
              className="text-button"
              type="button"
              disabled={busy}
              onClick={() => setEditing(false)}
            >
              Cancel editing
            </button>
          </div>
        </form>
      ) : null}
      {counting ? (
        <form className="context-form inventory-form" onSubmit={reviewCount}>
          <div className="form-intro">
            <h3>Count what is physically here</h3>
            <p>
              Enter the actual saleable on-hand count, including reserved units.
              Do not use this form for a supplier delivery.
            </p>
          </div>
          <div className="form-grid">
            <label>
              Counted on-hand units
              <input
                name="countedStock"
                type="number"
                min={product.reserved}
                step="1"
                value={countInput}
                onChange={(event) => setCountInput(event.target.value)}
                placeholder="Enter actual counted units"
                required
              />
            </label>
            <label>
              Count reason / evidence
              <input
                name="reference"
                required
                maxLength={500}
                placeholder="What was counted, by whom, and why it differs"
              />
            </label>
          </div>
          <dl
            className="stock-count-summary"
            aria-label="Physical count comparison"
          >
            <div>
              <dt>Before · on hand</dt>
              <dd>{product.stock}</dd>
            </div>
            <div>
              <dt>Counted · on hand</dt>
              <dd>{validCount ? countedStock : "—"}</dd>
            </div>
            <div>
              <dt>Adjustment</dt>
              <dd>{signedDelta}</dd>
            </div>
            <div>
              <dt>Available after</dt>
              <dd>
                {validCount && !belowReserved
                  ? countedStock - product.reserved
                  : "—"}
              </dd>
            </div>
          </dl>
          <p className="field-help">
            {product.reserved} reserved units stay reserved. Stock valuation and
            purchase records are unchanged.
          </p>
          {belowReserved ? (
            <p className="inline-warning" role="alert">
              The count cannot be below {product.reserved} reserved units.
              Resolve the affected order reservations before reducing stock
              further.
            </p>
          ) : null}
          {countInput.trim() && !validCount ? (
            <p className="inline-warning" role="alert">
              Enter a non-negative whole number of units.
            </p>
          ) : null}
          <div className="form-actions">
            <button
              className="button primary small"
              disabled={busy || !validCount || belowReserved}
            >
              Review physical count <Icon name="arrow" size={16} />
            </button>
            <button
              className="text-button"
              type="button"
              disabled={busy}
              onClick={() => setCounting(false)}
            >
              Cancel count
            </button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
