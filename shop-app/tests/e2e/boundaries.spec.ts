import { test, expect } from "./fixtures";
import {
  addProduct,
  ask,
  command,
  confirm,
  ownerLogin,
  previewLogin,
  setup,
  state,
} from "./helpers";

test("invalid currency, duplicate SKU, fractional quantity, and duplicate lines remain rejected", async ({
  page,
}) => {
  await ownerLogin(page);
  await page
    .getByRole("textbox", { name: "Business name", exact: true })
    .fill("Synthetic validation shop");
  await page
    .getByRole("textbox", { name: "Currency code", exact: true })
    .fill("QAT");
  await page
    .getByRole("combobox", { name: "Currency decimal places", exact: true })
    .selectOption("2");
  await page
    .getByRole("button", { name: "Review shop setup", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Confirm & save", exact: true })
    .click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    /currency/i
  );
  expect((await state(page.request)).revision).toBe(0);
  await page.keyboard.press("Escape");
  await setup(page);
  await addProduct(page);
  await ask(page, "Show product catalog");
  await page.getByRole("button", { name: "Add product", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Product name", exact: true })
    .fill("Synthetic duplicate");
  await page
    .getByRole("textbox", { name: "SKU", exact: true })
    .fill("E2E-PAINT");
  await page
    .getByRole("textbox", { name: "Category", exact: true })
    .fill("Synthetic");
  await page
    .getByRole("spinbutton", { name: "Selling price · USD", exact: true })
    .fill("1.00");
  await page
    .getByRole("button", { name: "Review product", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Confirm & save", exact: true })
    .click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    /SKU/i
  );
  expect((await state(page.request)).products).toHaveLength(1);
  await page.keyboard.press("Escape");
  await ask(page, "Take a new order");
  await page
    .getByRole("textbox", { name: "Customer name", exact: true })
    .fill("Synthetic invalid quantity");
  await page
    .getByRole("spinbutton", { name: "Quantity", exact: true })
    .fill("1.5");
  await page.getByRole("button", { name: "Review order", exact: true }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(
    page.getByRole("spinbutton", { name: "Quantity", exact: true })
  ).toBeFocused();
  await expect(
    page.getByRole("button", { name: "Add another item", exact: true })
  ).toBeDisabled();
  expect((await state(page.request)).orders).toHaveLength(0);
});

test("multi-line manual order totals exactly sum frozen item prices", async ({
  page,
}) => {
  await previewLogin(page);
  await ask(page, "Take a new order");
  await page
    .getByRole("textbox", { name: "Customer name", exact: true })
    .fill("Synthetic multiline customer");
  await page
    .getByRole("spinbutton", { name: "Quantity", exact: true })
    .fill("2");
  await page
    .getByRole("button", { name: "Add another item", exact: true })
    .click();
  await page
    .getByRole("spinbutton", { name: "Quantity", exact: true })
    .nth(1)
    .fill("3");
  await expect(
    page
      .getByRole("combobox", { name: "Product", exact: true })
      .nth(1)
      .getByRole("option", { name: /Demo building blocks/ })
  ).toHaveJSProperty("disabled", true);
  await page.getByRole("button", { name: "Review order", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("48.00 DEMO");
  await confirm(page);
  expect(
    (await state(page.request)).orders.find(
      (order) => order.customer === "Synthetic multiline customer"
    )
  ).toMatchObject({
    totalMinor: 4800,
    lines: [
      { productId: "block", quantity: 2, unitPriceMinor: 1200 },
      { productId: "marker", quantity: 3, unitPriceMinor: 800 },
    ],
  });
});

test("public commands enforce origin, scope, idempotency and unsupported payment boundaries", async ({
  page,
  app,
}) => {
  await previewLogin(page);
  const before = await state(page.request);
  const request = {
    type: "order.reserve",
    payload: { orderId: "wa-demo" },
    expectedRevision: before.revision,
    idempotencyKey: crypto.randomUUID(),
  };
  expect(
    (
      await page.request.post("/api/commands", {
        headers: {
          Origin: "https://synthetic.invalid",
          "X-Shop-Workspace": "preview",
        },
        data: request,
      })
    ).status()
  ).toBe(403);
  expect(
    (
      await page.request.post("/api/commands", {
        headers: { Origin: app.url, "X-Shop-Workspace": "shop" },
        data: request,
      })
    ).status()
  ).toBe(409);
  const send = (data: unknown) =>
    page.request.post("/api/commands", {
      headers: { Origin: app.url, "X-Shop-Workspace": "preview" },
      data,
    });
  expect((await send(request)).status()).toBe(200);
  expect((await send(request)).status()).toBe(200);
  expect((await state(page.request)).revision).toBe(before.revision + 1);
  expect(
    (await send({ ...request, payload: { orderId: "web-demo" } })).status()
  ).toBe(409);
  const revision = (await state(page.request)).revision;
  for (const [type, payload, reason] of [
    [
      "payment.record",
      {
        orderId: "web-demo",
        status: "confirmed",
        amountMinor: 1000,
        reference: "Synthetic partial",
      },
      /partial payments/i,
    ],
    [
      "payment.record",
      {
        orderId: "web-demo",
        status: "settled",
        amountMinor: 2000,
        reference: "Synthetic premature settlement",
      },
      /confirmed before settlement/i,
    ],
    [
      "payment.record",
      {
        orderId: "wa-demo",
        status: "collected",
        amountMinor: 1800,
        reference: "Synthetic premature cash",
      },
      /delivered/i,
    ],
    [
      "order.return-received",
      {
        orderId: "wa-demo",
        condition: "all-saleable",
        reference: "Synthetic premature return",
      },
      /failed delivery/i,
    ],
  ] as const) {
    const rejected = await command(
      page.request,
      app.url,
      "preview",
      type,
      payload
    );
    expect(rejected.ok()).toBe(false);
    expect((await rejected.json()).error).toMatch(reason);
    expect((await state(page.request)).revision).toBe(revision);
  }
});
