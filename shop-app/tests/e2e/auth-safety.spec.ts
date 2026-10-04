import { test, expect, fixturePassword } from "./fixtures";

test("owner entry waits for initial session discovery instead of clearing typed credentials", async ({
  page,
}) => {
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  let intercepted = 0;
  await page.route(/\/api\/(state|conversation)$/, async (route) => {
    intercepted++;
    await held;
    await route.continue();
  });
  try {
    await page.goto("/");
    await expect.poll(() => intercepted).toBeGreaterThan(0);
    await expect(
      page.getByRole("button", { name: "Own-business access", exact: true })
    ).toBeDisabled();
  } finally {
    release();
  }
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
  await expect(
    page.getByRole("heading", { name: "Make this space yours." })
  ).toBeVisible();
});

test("incorrect synthetic owner password shows an error without authenticating, then permits correction", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Explore the local preview", exact: true })
  ).toBeEnabled();
  await page
    .getByRole("button", { name: "Own-business access", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Owner password", exact: true })
    .fill("Deliberately-Wrong-Synthetic-Password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: /password|sign.in|access/i })
  ).toBeVisible();
  expect((await page.request.get("/api/state")).status()).toBe(401);
  await page
    .getByRole("textbox", { name: "Owner password", exact: true })
    .fill(fixturePassword);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Make this space yours." })
  ).toBeVisible();
});
