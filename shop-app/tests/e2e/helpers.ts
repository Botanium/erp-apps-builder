import { expect, type Page, type APIRequestContext } from "@playwright/test";
import type { Command, ShopState } from "../../src/lib/domain";
import { fixturePassword } from "./fixtures";

export async function ownerLogin(page: Page) {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Explore the local preview", exact: true })
  ).toBeEnabled();
  await page
    .getByRole("button", { name: "Own-business access", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Owner password", exact: true })
    .fill(fixturePassword);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByText("Own shop", { exact: true })).toBeVisible();
}
export async function previewLogin(page: Page) {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Explore the local preview", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", {
      name: "What would you like to do?",
      exact: true,
    })
  ).toBeVisible();
}
export async function confirm(page: Page, title?: string) {
  const dialog = page.getByRole(
    "dialog",
    title ? { name: title, exact: true } : {}
  );
  await expect(dialog).toBeVisible();
  await dialog
    .getByRole("button", { name: "Confirm & save", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
}
export async function setup(page: Page, currency = "USD", decimals = 2) {
  await page
    .getByRole("textbox", { name: "Business name", exact: true })
    .fill("Synthetic E2E Shop");
  await page
    .getByRole("textbox", { name: "Currency code", exact: true })
    .fill(currency);
  await page
    .getByRole("combobox", { name: "Currency decimal places", exact: true })
    .selectOption(String(decimals));
  await page
    .getByRole("button", { name: "Review shop setup", exact: true })
    .click();
  await confirm(page, "Set up your shop workspace");
}
export async function ask(page: Page, message: string) {
  const response = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/agent") &&
      response.request().method() === "POST"
  );
  await page
    .getByRole("textbox", { name: "What would you like to do?", exact: true })
    .fill(message);
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  expect((await response).ok()).toBeTruthy();
  await expect(
    page.getByRole("button", { name: "New task", exact: true })
  ).toBeEnabled();
  await expect(
    page.getByRole("button", { name: "Send message", exact: true })
  ).toBeDisabled();
}
export async function addProduct(
  page: Page,
  currency = "USD",
  price = "12.50",
  name = "Synthetic Paint Set",
  sku = "E2E-PAINT"
) {
  if (
    !(await page
      .getByRole("textbox", { name: "Product name", exact: true })
      .isVisible())
  ) {
    await ask(page, "Show product catalog");
    await page
      .getByRole("button", { name: "Add product", exact: true })
      .click();
  }
  await page
    .getByRole("textbox", { name: "Product name", exact: true })
    .fill(name);
  await page.getByRole("textbox", { name: "SKU", exact: true }).fill(sku);
  await page
    .getByRole("textbox", { name: "Category", exact: true })
    .fill("Synthetic Art");
  await page
    .getByRole("spinbutton", {
      name: `Selling price · ${currency}`,
      exact: true,
    })
    .fill(price);
  await page
    .getByRole("button", { name: "Review product", exact: true })
    .click();
  await confirm(page, "Add this product");
}
export async function state(request: APIRequestContext): Promise<ShopState> {
  const response = await request.get("/api/state");
  expect(response.status()).toBe(200);
  return (await response.json()).state;
}
export async function command(
  request: APIRequestContext,
  url: string,
  workspace: "shop" | "preview",
  type: Command["type"],
  payload: unknown,
  overrides: Record<string, unknown> = {}
) {
  const current = await state(request);
  return request.post("/api/commands", {
    headers: { Origin: url, "X-Shop-Workspace": workspace },
    data: {
      type,
      payload,
      expectedRevision: current.revision,
      idempotencyKey: crypto.randomUUID(),
      ...overrides,
    },
  });
}

export async function receiveStock(
  page: Page,
  quantity = "10",
  currency = "USD",
  unitCost = "5.25"
) {
  await ask(page, "Plan a supplier purchase");
  if (
    await page
      .getByRole("textbox", { name: "Supplier name", exact: true })
      .isVisible()
  ) {
    await expect(
      page.getByRole("button", { name: "Review purchase", exact: true })
    ).toBeDisabled();
    await page
      .getByRole("textbox", { name: "Supplier name", exact: true })
      .fill("Synthetic E2E Supplier");
    await page
      .getByRole("textbox", { name: "Contact", exact: true })
      .fill("supplier@example.invalid");
    await page
      .getByRole("button", { name: "Review supplier", exact: true })
      .click();
    await confirm(page, "Add supplier");
  }
  await page
    .getByRole("spinbutton", { name: "Quantity", exact: true })
    .fill(quantity);
  await page
    .getByRole("spinbutton", { name: `Unit cost · ${currency}`, exact: true })
    .fill(unitCost);
  await page
    .getByRole("textbox", { name: "Purchase reference", exact: true })
    .fill("Synthetic E2E PO");
  const before = await state(page.request);
  await page
    .getByRole("button", { name: "Review purchase", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "Stock remains unchanged"
  );
  await confirm(page, "Record supplier purchase");
  expect((await state(page.request)).products.map((p) => p.stock)).toEqual(
    before.products.map((p) => p.stock)
  );
  await page
    .getByRole("spinbutton", { name: /^Incoming quantity —/ })
    .fill(quantity);
  await page
    .getByRole("textbox", { name: "Receipt evidence", exact: true })
    .fill("Synthetic E2E counted receipt");
  await page
    .getByRole("button", { name: "Review stock receipt", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "Only these quantities are added to stock"
  );
  await confirm(page, "Receive selected quantities");
  await expect(
    page.getByText("All ordered quantities have a recorded stock receipt.", {
      exact: true,
    })
  ).toBeVisible();
}
export async function newOrder(
  page: Page,
  customer: string,
  channel = "Instagram",
  payment: "COD" | "online" = "COD",
  quantity = "2",
  details = true
) {
  await ask(page, "Take a new order");
  await page
    .getByRole("textbox", { name: "Customer name", exact: true })
    .fill(customer);
  await page
    .getByRole("combobox", { name: "Order came from", exact: true })
    .selectOption(channel);
  await page
    .getByRole("combobox", { name: "Payment method", exact: true })
    .selectOption(payment);
  await page
    .getByRole("spinbutton", { name: "Quantity", exact: true })
    .fill(quantity);
  if (details) {
    await page
      .getByRole("textbox", {
        name: "Delivery address optional until reservation",
        exact: true,
      })
      .fill("Synthetic E2E address — no dispatch");
    await page
      .getByRole("textbox", {
        name: "Contact optional until reservation",
        exact: true,
      })
      .fill("customer@example.invalid");
  }
  await page.getByRole("button", { name: "Review order", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText(
    `Manual source label: ${channel}`
  );
  await confirm(page, "Record this customer order");
  return (await state(page.request)).orders.find(
    (order) => order.customer === customer
  )!;
}
export async function openOrder(page: Page, id: string) {
  await ask(page, `Review ${id}`);
  await page
    .getByRole("button", { name: new RegExp(id), expanded: false })
    .click();
}
export async function advance(
  page: Page,
  id: string,
  action:
    "Reserve stock" | "Mark packed" | "Record dispatch" | "Record delivery"
) {
  await openOrder(page, id);
  if (action === "Record dispatch")
    await page
      .getByRole("textbox", {
        name: "Human-entered courier / dispatch evidence",
        exact: true,
      })
      .fill("Synthetic E2E dispatch evidence");
  if (action === "Record delivery")
    await page
      .getByRole("textbox", {
        name: "Human-entered delivery evidence",
        exact: true,
      })
      .fill("Synthetic E2E delivery evidence");
  await page.getByRole("button", { name: action, exact: true }).click();
  await confirm(page);
}
export async function paymentRecord(
  page: Page,
  next: "collected" | "remitted" | "confirmed" | "settled"
) {
  await ask(page, "Review payment records");
  await page
    .getByRole("textbox", { name: `Evidence for “${next}”`, exact: true })
    .fill(`Synthetic E2E ${next} evidence`);
  await page
    .getByRole("button", { name: `Review ${next} record`, exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "No money moves through this app"
  );
  await confirm(page, `Record payment as ${next}`);
}
export async function logout(page: Page) {
  await page
    .getByRole("button", { name: "Workspace options", exact: true })
    .click();
  await page
    .getByRole("button", { name: "End local session", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Explore the local preview", exact: true })
  ).toBeEnabled();
}
