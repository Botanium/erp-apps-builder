import { test, expect } from "./fixtures";
import { addProduct, ownerLogin, setup, state } from "./helpers";

test("empty owner explicitly configures three-decimal currency before product money", async ({
  page,
}) => {
  await ownerLogin(page);
  await expect(
    page.getByRole("heading", { name: "Make this space yours." })
  ).toBeVisible();
  const empty = await state(page.request);
  expect({
    products: empty.products,
    orders: empty.orders,
    suppliers: empty.suppliers,
    currency: empty.currency,
  }).toEqual({ products: [], orders: [], suppliers: [], currency: "" });
  await setup(page, "KWD", 3);
  await addProduct(page, "KWD", "2.345");
  await expect(
    page.getByRole("region", { name: "Synthetic Paint Set", exact: true })
  ).toContainText("0 reserved · 2.345 KWD");
  const saved = await state(page.request);
  expect(saved.products).toEqual([
    expect.objectContaining({
      name: "Synthetic Paint Set",
      priceMinor: 2345,
      stock: 0,
      reserved: 0,
    }),
  ]);
  await page.reload();
  await expect(
    page.getByRole("region", { name: "Synthetic Paint Set", exact: true })
  ).toContainText("0 reserved · 2.345 KWD");
});

for (const example of [
  { currency: "JPY", decimals: 0, price: "125", minor: 125 },
  { currency: "USD", decimals: 2, price: "12.50", minor: 1250 },
]) {
  test(`owner ${example.decimals}-decimal currency survives product save and reload`, async ({
    page,
  }) => {
    await ownerLogin(page);
    await setup(page, example.currency, example.decimals);
    await addProduct(page, example.currency, example.price);
    await page.reload();
    await expect(
      page.getByRole("region", { name: "Synthetic Paint Set", exact: true })
    ).toContainText(`0 reserved · ${example.price} ${example.currency}`);
    expect((await state(page.request)).products[0].priceMinor).toBe(
      example.minor
    );
  });
}
