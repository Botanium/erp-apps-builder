import { test, expect } from "./fixtures";
import {
  advance,
  ask,
  confirm,
  openOrder,
  previewLogin,
  state,
} from "./helpers";

test("missing delivery details and oversell stay blocked; cancellation releases exact reserved stock", async ({
  page,
}) => {
  await previewLogin(page);
  await openOrder(page, "ig-demo");
  await expect(
    page.getByRole("button", { name: "Reserve stock", exact: true })
  ).toBeDisabled();
  await page
    .getByRole("textbox", { name: "Delivery address", exact: true })
    .fill("Synthetic E2E address");
  await page
    .getByRole("textbox", { name: "Contact", exact: true })
    .fill("synthetic@example.invalid");
  await page
    .getByRole("button", { name: "Review delivery details", exact: true })
    .click();
  await confirm(page);
  await advance(page, "wa-demo", "Reserve stock");
  await advance(page, "web-demo", "Reserve stock");
  await openOrder(page, "ig-demo");
  await expect(
    page.getByRole("button", { name: "Reserve stock", exact: true })
  ).toBeDisabled();
  await expect(
    page.getByText("There is not enough available stock for this order.", {
      exact: false,
    })
  ).toBeVisible();
  expect(
    (await state(page.request)).products.find((p) => p.id === "marker")
  ).toMatchObject({ stock: 2, reserved: 2 });
  await openOrder(page, "wa-demo");
  await page.getByText("Cancel this unpaid order", { exact: true }).click();
  await page
    .getByRole("textbox", { name: "Cancellation reason", exact: true })
    .fill("Synthetic customer changed mind");
  await page
    .getByRole("button", { name: "Review cancellation", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "Reserved stock will be released"
  );
  await confirm(page);
  const cancelled = await state(page.request);
  expect(cancelled.orders.find((o) => o.id === "wa-demo")?.status).toBe(
    "cancelled"
  );
  expect(cancelled.products.find((p) => p.id === "marker")).toMatchObject({
    stock: 2,
    reserved: 1,
  });
  expect(cancelled.products.find((p) => p.id === "notebook")).toMatchObject({
    stock: 4,
    reserved: 0,
  });
  await ask(page, "Show product catalog");
  await expect(
    page.getByRole("region", { name: "Demo marker set", exact: true })
  ).toContainText("1 reserved · 8.00 DEMO");
  await page.reload();
  await expect(
    page.getByRole("region", { name: "Demo marker set", exact: true })
  ).toContainText("1 reserved · 8.00 DEMO");
});
