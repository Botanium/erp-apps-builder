import { test, expect } from "./fixtures";
import { ask, confirm, newOrder, previewLogin } from "./helpers";

for (const width of [390, 320]) {
  test(`stock, receipt and order forms remain usable without overflow at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 844 });
    await previewLogin(page);
    await ask(page, "Show product catalog");
    const marker = page.getByRole("region", {
      name: "Demo marker set",
      exact: true,
    });
    await marker
      .getByRole("button", { name: "Record physical count", exact: true })
      .click();
    await expect(
      marker.getByRole("spinbutton", {
        name: "Counted on-hand units",
        exact: true,
      })
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath(`mobile-inventory-${width}.png`),
      fullPage: true,
    });
    await ask(page, "Plan a supplier purchase");
    await page
      .getByRole("spinbutton", { name: "Quantity", exact: true })
      .fill("10");
    await page
      .getByRole("spinbutton", { name: "Unit cost · DEMO", exact: true })
      .fill("2.50");
    await page
      .getByRole("textbox", { name: "Purchase reference", exact: true })
      .fill("Synthetic mobile purchase");
    await page
      .getByRole("button", { name: "Review purchase", exact: true })
      .click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true);
    await confirm(page);
    await page
      .getByRole("spinbutton", { name: /^Incoming quantity —/ })
      .fill("4");
    await page
      .getByRole("textbox", { name: "Receipt evidence", exact: true })
      .fill("Synthetic mobile receipt");
    await page
      .getByRole("button", { name: "Review stock receipt", exact: true })
      .click();
    await confirm(page);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath(`mobile-receipt-${width}.png`),
      fullPage: true,
    });
    await newOrder(page, "Synthetic mobile customer", "WhatsApp", "COD", "1");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath(`mobile-order-${width}.png`),
      fullPage: true,
    });
  });
}
