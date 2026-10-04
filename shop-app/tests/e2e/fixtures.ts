import { test as base, expect } from "@playwright/test";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { randomBytes, scryptSync } from "node:crypto";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createServer } from "node:net";

export const fixturePassword = "Public-Synthetic-E2E-Only-2026";
export const test = base.extend<{ app: { url: string } }>({
  app: [
    async ({}, use, testInfo) => {
      const root = path.resolve(__dirname, "../..");
      const output = path.join(root, "output/playwright/e2e/fixtures");
      await mkdir(output, { recursive: true });
      const folder = await mkdtemp(path.join(output, "run-"));
      const salt = randomBytes(16);
      const hash = scryptSync(fixturePassword, salt, 64, {
        N: 32768,
        r: 8,
        p: 1,
        maxmem: 64 * 1024 * 1024,
      });
      const port = 4330;
      const url = `http://127.0.0.1:${port}`;
      // Refuse existing listeners; never accidentally exercise a user's running app.
      const probe = createServer();
      await new Promise<void>((resolve, reject) => {
        probe.once("error", reject);
        probe.listen(port, "127.0.0.1", resolve);
      });
      await new Promise<void>((resolve, reject) =>
        probe.close((error) => (error ? reject(error) : resolve()))
      );
      const env: NodeJS.ProcessEnv = {
        ...process.env,
        NODE_ENV: "development",
        VERCEL: "",
        DATABASE_URL: "",
        OPENAI_API_KEY: "",
        NEXT_TELEMETRY_DISABLED: "1",
        SHOP_QA_MODE: "true",
        SHOP_E2E_MODE: "true",
        SHOP_AI_ENABLED: "false",
        SHOP_VOICE_ENABLED: "false",
        SHOP_AI_BUDGET_MICRO_USD: "0",
        SHOP_OWNER_PASSWORD_HASH: `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`,
        SHOP_SESSION_SECRET: randomBytes(32).toString("hex"),
        SHOP_APP_ORIGIN: url,
        SHOP_DB_PATH: path.join(folder, "owner.sqlite"),
        SHOP_PREVIEW_DB_PATH: path.join(folder, "preview.sqlite"),
        SHOP_AUTH_DB_PATH: path.join(folder, "auth.sqlite"),
        NODE_OPTIONS: `--import=${pathToFileURL(path.join(root, "tests/e2e/network-guard.mjs")).href}`,
      };
      const child = spawn(
        process.execPath,
        [
          path.join(root, "node_modules/next/dist/bin/next"),
          "dev",
          "--hostname",
          "127.0.0.1",
          "--port",
          String(port),
        ],
        { cwd: root, env, stdio: ["ignore", "pipe", "pipe"] }
      );
      let logs = "";
      child.stdout.on("data", (value) => {
        logs += value.toString();
      });
      child.stderr.on("data", (value) => {
        logs += value.toString();
      });
      try {
        await expect
          .poll(
            async () => {
              if (child.exitCode !== null)
                throw new Error(
                  `Isolated E2E server exited: ${logs.slice(-4000)}`
                );
              return fetch(url)
                .then((response) => response.status)
                .catch(() => 0);
            },
            { timeout: 60_000, intervals: [200, 500, 1000] }
          )
          .toBe(200);
        await use({ url });
      } finally {
        if (child.exitCode === null) {
          child.kill("SIGTERM");
          await Promise.race([
            once(child, "exit"),
            new Promise((resolve) => setTimeout(resolve, 5000)),
          ]);
        }
        if (child.exitCode === null) {
          child.kill("SIGKILL");
          await once(child, "exit");
        }
        await writeFile(path.join(folder, "server.log"), logs);
        await testInfo.attach("synthetic-fixture", {
          body: `${folder}\n${url}\nNo real provider credentials or microphone used.`,
          contentType: "text/plain",
        });
      }
    },
    { timeout: 75_000 },
  ],
  baseURL: async ({ app }, use) => use(app.url),
  context: async ({ browser, app }, use) => {
    const context = await browser.newContext({
      baseURL: app.url,
      viewport: { width: 1280, height: 900 },
    });
    await context.route("**/*", (route) =>
      new URL(route.request().url()).origin === app.url
        ? route.continue()
        : route.abort("blockedbyclient")
    );
    await context.addInitScript(() => {
      Object.defineProperty(navigator, "mediaDevices", {
        configurable: true,
        value: {
          getUserMedia: async () => {
            throw new Error("Real microphone prohibited in E2E");
          },
        },
      });
    });
    await use(context);
    await context.close();
  },
});
export { expect };
