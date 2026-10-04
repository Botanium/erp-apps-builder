import { test, expect } from "./fixtures";
import {
  addProduct,
  advance,
  ask,
  command,
  confirm,
  newOrder,
  openOrder,
  ownerLogin,
  previewLogin,
  setup,
  state,
} from "./helpers";

test("product edits affect future orders without rewriting existing price snapshots", async ({
  page,
}) => {
  await ownerLogin(page);
  await setup(page);
  await addProduct(page);
  const original = await newOrder(page, "Synthetic original price customer");
  expect(original.totalMinor).toBe(2500);
  await ask(page, "Show product catalog");
  await page
    .getByRole("button", { name: "Edit product", exact: true })
    .click({ timeout: 5000 });
  await page
    .getByRole("textbox", { name: "Product name", exact: true })
    .fill("Synthetic Updated Paint Set");
  await page
    .getByRole("textbox", { name: "SKU", exact: true })
    .fill("E2E-UPDATED");
  await page
    .getByRole("spinbutton", { name: "Selling price · USD", exact: true })
    .fill("15.00");
  await page
    .getByRole("button", { name: "Review product changes", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("12.50 USD");
  await expect(page.getByRole("dialog")).toContainText("15.00 USD");
  await confirm(page);
  const edited = await state(page.request);
  expect(edited.products[0]).toMatchObject({
    name: "Synthetic Updated Paint Set",
    sku: "E2E-UPDATED",
    priceMinor: 1500,
  });
  expect(edited.orders.find((order) => order.id === original.id)).toMatchObject(
    {
      totalMinor: 2500,
      lines: [expect.objectContaining({ unitPriceMinor: 1250 })],
    }
  );
  const next = await newOrder(page, "Synthetic new price customer");
  expect(next.totalMinor).toBe(3000);
});

test("failed unpaid COD delivery restores stock only after a full saleable return", async ({
  page,
  app,
}) => {
  await previewLogin(page);
  for (const action of [
    "Reserve stock",
    "Mark packed",
    "Record dispatch",
  ] as const)
    await advance(page, "wa-demo", action);
  const dispatched = await state(page.request);
  expect(
    dispatched.products.find((product) => product.id === "marker")?.stock
  ).toBe(1);
  await openOrder(page, "wa-demo");
  await page
    .getByRole("button", { name: "Record delivery failed", exact: true })
    .click({ timeout: 5000 });
  await page
    .getByRole("textbox", { name: "Failure evidence", exact: true })
    .fill("Synthetic courier could not deliver");
  await page
    .getByRole("button", { name: "Review unsuccessful delivery", exact: true })
    .click();
  await confirm(page);
  expect(
    (await state(page.request)).products.find(
      (product) => product.id === "marker"
    )?.stock
  ).toBe(1);
  expect(
    (await state(page.request)).orders.find((order) => order.id === "wa-demo")
      ?.status
  ).toBe("delivery-failed");
  for (const condition of ["damaged", "partial", "missing"]) {
    const rejected = await command(
      page.request,
      app.url,
      "preview",
      "order.return-received",
      {
        orderId: "wa-demo",
        condition,
        reference: "Synthetic unsupported condition",
      }
    );
    expect(rejected.ok()).toBe(false);
  }
  await openOrder(page, "wa-demo");
  await expect(
    page.getByRole("button", {
      name: "Review full saleable return",
      exact: true,
    })
  ).toBeDisabled();
  await page.getByRole("checkbox", { name: /all.*saleable/i }).check();
  await page
    .getByRole("textbox", { name: "Return receipt evidence", exact: true })
    .fill("Synthetic all goods counted saleable");
  await page
    .getByRole("button", { name: "Review full saleable return", exact: true })
    .click();
  await confirm(page);
  const returned = await state(page.request);
  expect(returned.orders.find((order) => order.id === "wa-demo")).toMatchObject(
    { status: "returned", paymentStatus: "not-due" }
  );
  expect(
    returned.products.find((product) => product.id === "marker")
  ).toMatchObject({ stock: 2, reserved: 0 });
  expect(
    returned.products.find((product) => product.id === "notebook")
  ).toMatchObject({ stock: 4, reserved: 0 });
  const repeat = await command(
    page.request,
    app.url,
    "preview",
    "order.return-received",
    {
      orderId: "wa-demo",
      condition: "all-saleable",
      reference: "Synthetic duplicate return",
    }
  );
  expect(repeat.ok()).toBe(false);
  expect((await state(page.request)).revision).toBe(returned.revision);
  await page.reload();
  await ask(page, "Review customer payments");
  await expect(page.getByText("not-due", { exact: true })).toBeVisible();
  await ask(page, "What needs attention?");
  await expect(
    page.getByRole("heading", {
      name: "2 payment records need follow-through",
      exact: true,
    })
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "2 orders have a next step", exact: true })
  ).toBeVisible();
});

test("partial purchase receipts 10 to 4 to 6 preserve remainder and exact stock", async ({
  page,
  app,
}) => {
  await previewLogin(page);
  await ask(page, "Plan a supplier purchase");
  await page
    .getByRole("combobox", { name: "Product", exact: true })
    .selectOption("marker");
  await page
    .getByRole("spinbutton", { name: "Quantity", exact: true })
    .fill("10");
  await page
    .getByRole("spinbutton", { name: "Unit cost · DEMO", exact: true })
    .fill("5.00");
  await page
    .getByRole("textbox", { name: "Purchase reference", exact: true })
    .fill("Synthetic staggered purchase");
  await page
    .getByRole("button", { name: "Review purchase", exact: true })
    .click();
  await confirm(page);
  const incoming = page.getByRole("spinbutton", {
    name: "Incoming quantity — Demo marker set",
    exact: true,
  });
  await expect(incoming).toHaveValue("0", { timeout: 5000 });
  await expect(
    page.getByRole("button", { name: "Review stock receipt", exact: true })
  ).toBeDisabled();
  for (const [quantity, received, remaining] of [
    [4, 4, 6],
    [6, 10, 0],
  ]) {
    await incoming.fill(String(quantity));
    await page
      .getByRole("textbox", { name: "Receipt evidence", exact: true })
      .fill(`Synthetic arrival ${quantity}`);
    await page
      .getByRole("button", { name: "Review stock receipt", exact: true })
      .click();
    await confirm(page);
    const current = await state(page.request);
    expect(
      current.products.find((product) => product.id === "marker")?.stock
    ).toBe(2 + received);
    expect(current.purchases[0].lines[0]).toMatchObject({
      receivedQuantity: received,
      remainingQuantity: remaining,
    });
    expect(current.purchases[0].status).toBe(
      remaining ? "partially-received" : "received"
    );
    if (remaining) {
      const purchaseId = current.purchases[0].id;
      const over = await command(
        page.request,
        app.url,
        "preview",
        "purchase.receive-lines",
        {
          purchaseId,
          lines: [{ productId: "marker", quantity: 7 }],
          reference: "Synthetic over-receipt rejection",
        }
      );
      expect(over.ok()).toBe(false);
      const legacyFull = await command(
        page.request,
        app.url,
        "preview",
        "purchase.receive",
        { purchaseId, reference: "Synthetic full receipt after partial" }
      );
      expect(legacyFull.ok()).toBe(false);
      expect((await state(page.request)).revision).toBe(current.revision);
      await page.reload();
      await expect(incoming).toHaveValue("0");
    }
  }
  await expect(incoming).toHaveCount(0);
  expect((await state(page.request)).purchases[0].receipts).toHaveLength(2);
});

test("physical counts show adjustment and cannot erase reserved units", async ({
  page,
}) => {
  await previewLogin(page);
  await advance(page, "wa-demo", "Reserve stock");
  await ask(page, "Show product catalog");
  await page
    .getByRole("region", { name: "Demo marker set", exact: true })
    .getByRole("button", { name: "Record physical count", exact: true })
    .click({ timeout: 5000 });
  await page
    .getByRole("spinbutton", { name: "Counted on-hand units", exact: true })
    .fill("0");
  await page
    .getByRole("textbox", { name: "Count reason / evidence", exact: true })
    .fill("Synthetic shelf count");
  await expect(
    page.getByRole("button", { name: "Review physical count", exact: true })
  ).toBeDisabled();
  await page
    .getByRole("spinbutton", { name: "Counted on-hand units", exact: true })
    .fill("7");
  await page
    .getByRole("button", { name: "Review physical count", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("7");
  await confirm(page);
  const counted = await state(page.request);
  expect(
    counted.products.find((product) => product.id === "marker")
  ).toMatchObject({ stock: 7, reserved: 1 });
  await page.reload();
  expect(
    (await state(page.request)).products.find(
      (product) => product.id === "marker"
    )
  ).toMatchObject({ stock: 7, reserved: 1 });
});
