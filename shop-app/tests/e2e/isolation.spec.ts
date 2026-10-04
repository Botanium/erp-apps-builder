import { test, expect } from "./fixtures";
import {
  addProduct,
  ask,
  confirm,
  logout,
  ownerLogin,
  previewLogin,
  setup,
  state,
} from "./helpers";

test("records and conversation survive a new tab and re-login without leaking into preview", async ({
  page,
  context,
}) => {
  await ownerLogin(page);
  await setup(page);
  await addProduct(page);
  await ask(page, "Show product catalog for my synthetic owner shop");
  await page
    .getByRole("textbox", { name: "What would you like to do?" })
    .fill("Unsent owner draft");
  const second = await context.newPage();
  await second.goto("/");
  await expect(
    second.getByText("Show product catalog for my synthetic owner shop", {
      exact: true,
    })
  ).toBeVisible();
  await expect(
    second.getByText("Synthetic Paint Set", { exact: true })
  ).toBeVisible();
  await logout(second);
  await previewLogin(second);
  await expect(
    second.getByText("Show product catalog for my synthetic owner shop", {
      exact: true,
    })
  ).toHaveCount(0);
  await expect(
    second.getByText("Synthetic Paint Set", { exact: true })
  ).toHaveCount(0);
  await expect(
    second.getByRole("textbox", { name: "What would you like to do?" })
  ).toHaveValue("");
  await expect(
    second.getByText(/saved and read back from workspace records/)
  ).toHaveCount(0);
  expect(
    (await state(second.request)).products.some(
      (product) => product.sku === "E2E-PAINT"
    )
  ).toBe(false);
  await logout(second);
  await ownerLogin(second);
  await expect(
    second.getByText("Show product catalog for my synthetic owner shop", {
      exact: true,
    })
  ).toBeVisible();
  expect((await state(second.request)).products).toHaveLength(1);
  await logout(second);
  expect((await second.request.get("/api/state")).status()).toBe(401);
  expect((await second.request.get("/api/conversation")).status()).toBe(401);
});

test("cross-tab workspace change cancels a visible owner proposal without a preview write", async ({
  page,
  context,
}) => {
  await ownerLogin(page);
  await setup(page);
  await ask(page, "Show product catalog");
  await page.getByRole("button", { name: "Add product", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Product name", exact: true })
    .fill("Synthetic stale owner product");
  await page
    .getByRole("textbox", { name: "SKU", exact: true })
    .fill("STALE-OWNER");
  await page
    .getByRole("textbox", { name: "Category", exact: true })
    .fill("Synthetic");
  await page
    .getByRole("spinbutton", { name: "Selling price · USD", exact: true })
    .fill("1.00");
  await page
    .getByRole("button", { name: "Review product", exact: true })
    .click();
  const second = await context.newPage();
  await second.goto("/");
  await expect(second.getByText("Own shop", { exact: true })).toBeVisible();
  await logout(second);
  await previewLogin(second);
  const before = await state(second.request);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Confirm & save", exact: true })
    .click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(
    page.getByRole("alert").filter({ hasText: "workspace changed" })
  ).toBeVisible();
  const after = await state(second.request);
  expect(after.revision).toBe(before.revision);
  expect(after.products.some((product) => product.sku === "STALE-OWNER")).toBe(
    false
  );
});

test("stale revisions cannot overwrite another tab and double-click saves once", async ({
  page,
  context,
}) => {
  await ownerLogin(page);
  await setup(page);
  await ask(page, "Show product catalog");
  await page.getByRole("button", { name: "Add product", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Product name", exact: true })
    .fill("Synthetic stale product");
  await page.getByRole("textbox", { name: "SKU", exact: true }).fill("STALE");
  await page
    .getByRole("textbox", { name: "Category", exact: true })
    .fill("Synthetic");
  await page
    .getByRole("spinbutton", { name: "Selling price · USD", exact: true })
    .fill("1.00");
  await page
    .getByRole("button", { name: "Review product", exact: true })
    .click();
  const second = await context.newPage();
  await second.goto("/");
  await expect(second.getByText("Own shop", { exact: true })).toBeVisible();
  await addProduct(
    second,
    "USD",
    "2.00",
    "Synthetic winning product",
    "WINNER"
  );
  const before = await state(second.request);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Confirm & save", exact: true })
    .click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "State changed"
  );
  expect((await state(page.request)).revision).toBe(before.revision);
  await page.keyboard.press("Escape");
  await ask(page, "Show product catalog");
  await page.getByRole("button", { name: "Add product", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Product name", exact: true })
    .fill("Synthetic double click product");
  await page.getByRole("textbox", { name: "SKU", exact: true }).fill("ONCE");
  await page
    .getByRole("textbox", { name: "Category", exact: true })
    .fill("Synthetic");
  await page
    .getByRole("spinbutton", { name: "Selling price · USD", exact: true })
    .fill("3.00");
  await page
    .getByRole("button", { name: "Review product", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Confirm & save", exact: true })
    .dblclick();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  const after = await state(page.request);
  expect(
    after.products.filter((product) => product.sku === "ONCE")
  ).toHaveLength(1);
  expect(after.revision).toBe(before.revision + 1);
});
