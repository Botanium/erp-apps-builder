import { test, expect } from "./fixtures";
import { ownerLogin } from "./helpers";

for (const width of [1280, 390, 320]) {
  test(`setup and confirmation remain keyboard-operable without overflow at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 844 });
    await ownerLogin(page);
    await page
      .getByRole("button", { name: "Review shop setup", exact: true })
      .click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(
      page.getByRole("textbox", { name: "Business name", exact: true })
    ).toBeFocused();
    await page.keyboard.type("Synthetic Keyboard Shop");
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("textbox", { name: "Currency code", exact: true })
    ).toBeFocused();
    await page.keyboard.type("USD");
    await page.keyboard.press("Tab");
    await page.keyboard.press("2");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", {
      name: "Set up your shop workspace",
    });
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole("button", { name: "Close review" })
    ).toBeFocused();
    for (let index = 0; index < 5; index++) {
      await page.keyboard.press("Tab");
      const focus = await page.evaluate(() => ({
        inside: !!document.activeElement?.closest("dialog[open]"),
        tag: document.activeElement?.tagName,
        text: document.activeElement?.textContent?.slice(0, 80),
      }));
      // Native modal dialogs may send Tab to browser chrome (activeElement BODY),
      // but no background application control may receive focus.
      expect(focus.inside || focus.tag === "BODY", JSON.stringify(focus)).toBe(
        true
      );
    }
    await page.keyboard.press("Shift+Tab");
    expect(
      await page.evaluate(
        () =>
          !!document.activeElement?.closest("dialog[open]") ||
          document.activeElement === document.body
      )
    ).toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath(`setup-review-${width}.png`),
    });
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: "Review shop setup", exact: true })
    ).toBeFocused();
    await expect(
      page.getByRole("textbox", { name: "Business name" })
    ).toHaveValue("Synthetic Keyboard Shop");
  });
}
