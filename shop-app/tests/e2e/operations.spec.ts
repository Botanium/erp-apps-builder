import { test, expect } from "./fixtures";
import {
  addProduct,
  advance,
  ask,
  newOrder,
  openOrder,
  ownerLogin,
  paymentRecord,
  receiveStock,
  setup,
  state,
} from "./helpers";

test("empty shop receives stock and fulfills all three manual channels with independent COD and online money", async ({
  page,
}, testInfo) => {
  test.setTimeout(150_000);
  await ownerLogin(page);
  await setup(page);
  await addProduct(page);
  await receiveStock(page);
  expect((await state(page.request)).products[0].stock).toBe(10);
  for (const channel of ["Instagram", "WhatsApp", "Website"]) {
    const online = channel === "Website";
    const order = await newOrder(
      page,
      `Synthetic ${channel} Customer`,
      channel,
      online ? "online" : "COD"
    );
    expect(order.totalMinor).toBe(2500);
    await expect(
      page.getByRole("button", { name: new RegExp(order.id) })
    ).toContainText("25.00 USD");
    await advance(page, order.id, "Reserve stock");
    await advance(page, order.id, "Mark packed");
    if (online) {
      await openOrder(page, order.id);
      await expect(
        page.getByRole("button", { name: "Record dispatch", exact: true })
      ).toBeDisabled();
      await expect(
        page.getByText("Record online payment confirmation before dispatch.", {
          exact: false,
        })
      ).toBeVisible();
      await paymentRecord(page, "confirmed");
      expect(
        (await state(page.request)).orders.find((o) => o.id === order.id)
          ?.status
      ).toBe("packed");
    } else {
      await ask(page, "Review payment records");
      await expect(
        page.getByRole("button", {
          name: "Review collected record",
          exact: true,
        })
      ).toBeDisabled();
    }
    await advance(page, order.id, "Record dispatch");
    await advance(page, order.id, "Record delivery");
    await ask(page, "What needs attention?");
    await expect(
      page.getByRole("heading", {
        name: "1 payment records need follow-through",
        exact: true,
      })
    ).toBeVisible();
    await expect(
      page.getByRole("button", {
        name: "0 orders have a next step",
        exact: true,
      })
    ).toBeVisible();
    if (online) await paymentRecord(page, "settled");
    else {
      await paymentRecord(page, "collected");
      await paymentRecord(page, "remitted");
    }
  }
  const final = await state(page.request);
  expect(final.products[0]).toMatchObject({ stock: 4, reserved: 0 });
  expect(
    final.orders.map((o) => [
      o.channel,
      o.status,
      o.paymentStatus,
      o.totalMinor,
    ])
  ).toEqual([
    ["Instagram", "delivered", "remitted", 2500],
    ["WhatsApp", "delivered", "remitted", 2500],
    ["Website", "delivered", "settled", 2500],
  ]);
  await page.reload();
  await expect(page.getByText("25.00 USD", { exact: true })).toHaveCount(3);
  await page
    .getByRole("heading", { name: "Keep the money story clear.", exact: true })
    .scrollIntoViewIfNeeded();
  await page.screenshot({
    path: testInfo.outputPath("owner-completed-desktop.png"),
  });
});
