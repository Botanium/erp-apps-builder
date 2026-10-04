import { test, expect } from "./fixtures";
import { ask, previewLogin, state } from "./helpers";

test("local guidance routes review intents to actionable records without claiming live integrations", async ({
  page,
}) => {
  await previewLogin(page);
  const before = await state(page.request);
  await expect(
    page.getByRole("checkbox", {
      name: "Use AI for next text reply",
      exact: true,
    })
  ).toBeDisabled();
  for (const prompt of [
    "Show my orders",
    "Show my Instagram orders",
    "Review WhatsApp orders",
  ]) {
    await ask(page, prompt);
    await expect(
      page.getByRole("button", { name: /ig-demo/, expanded: false })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /wa-demo/, expanded: false })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /web-demo/, expanded: false })
    ).toBeVisible();
    await expect(
      page.getByRole("textbox", { name: "Customer name", exact: true })
    ).toHaveCount(0);
  }
  await ask(page, "Review customer payments");
  await expect(
    page.getByRole("heading", {
      name: "Keep the money story clear.",
      exact: true,
    })
  ).toBeVisible();
  await ask(page, "Show setup and what is not connected");
  await expect(
    page.getByText("LOCAL / RULE-BASED", { exact: true })
  ).toBeVisible();
  await expect(page.getByText("NOT CONNECTED", { exact: true })).toHaveCount(2);
  await ask(page, "Show recent activity");
  await expect(
    page.getByText("No changes yet. Your confirmed actions will appear here.", {
      exact: true,
    })
  ).toBeVisible();
  expect((await state(page.request)).revision).toBe(before.revision);
});
