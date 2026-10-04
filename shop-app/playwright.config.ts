import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "./output/playwright/e2e/artifacts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 10_000 },
  reporter: [
    ["list"],
    ["html", { outputFolder: "output/playwright/e2e/report", open: "never" }],
  ],
  use: {
    actionTimeout: 15000,
    browserName: "chromium",
    headless: true,
    viewport: { width: 1280, height: 900 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
    ...(process.env.PLAYWRIGHT_EXECUTABLE
      ? { launchOptions: { executablePath: process.env.PLAYWRIGHT_EXECUTABLE } }
      : {}),
  },
});
