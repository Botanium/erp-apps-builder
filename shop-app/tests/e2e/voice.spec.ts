import { test, expect } from "./fixtures";
import { ownerLogin, previewLogin, setup, state } from "./helpers";

async function mockAudio(page: import("@playwright/test").Page) {
  await page.evaluate(() => {
    const counters = { captures: 0, stops: 0 };
    Object.assign(window, { syntheticAudio: counters });
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: async () => {
          counters.captures++;
          return { getTracks: () => [{ stop: () => counters.stops++ }] };
        },
      },
    });
    class SyntheticAudioContext {
      state = "running";
      sampleRate = 16000;
      destination = {};
      async resume() {}
      async close() {
        this.state = "closed";
      }
      createMediaStreamSource() {
        return { connect() {}, disconnect() {} };
      }
      createGain() {
        return { gain: { value: 0 }, connect() {}, disconnect() {} };
      }
      createScriptProcessor() {
        const processor = {
          onaudioprocess: null as null | ((event: unknown) => void),
          disconnect() {},
          connect() {
            queueMicrotask(() =>
              processor.onaudioprocess?.({
                inputBuffer: { getChannelData: () => new Float32Array(2048) },
              })
            );
          },
        };
        return processor;
      }
    }
    Object.defineProperty(window, "AudioContext", {
      configurable: true,
      value: SyntheticAudioContext,
    });
  });
}

test("disabled voice explains availability and never requests capture or provider work", async ({
  page,
}) => {
  let submissions = 0;
  page.on("request", (request) => {
    if (/\/api\/voice\//.test(request.url())) submissions++;
  });
  await previewLogin(page);
  await page
    .getByRole("button", { name: "Voice conversation", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Start recording", exact: true })
  ).toBeDisabled();
  await expect(
    page.getByRole("region", { name: "Turn-based voice conversation" })
  ).toContainText(/preview|disabled|unavailable/i);
  await page
    .getByRole("checkbox", { name: /I consent to microphone capture/ })
    .check();
  await expect(
    page.getByRole("button", { name: "Start recording", exact: true })
  ).toBeDisabled();
  expect(submissions).toBe(0);
});

test("mocked voice requires consent, supports interrupt, and reports transcription failure without retry", async ({
  page,
}) => {
  await ownerLogin(page);
  await setup(page);
  await mockAudio(page);
  await page.route("**/api/voice", (route) =>
    route.fulfill({
      json: {
        available: true,
        mode: "turn-based",
        reason: "Synthetic boundary",
        maxSeconds: 10,
        maxSpeechCharacters: 1000,
      },
    })
  );
  let transcriptions = 0;
  await page.route("**/api/voice/transcribe", (route) => {
    transcriptions++;
    return route.fulfill({
      status: 503,
      json: { error: "Synthetic transcription unavailable" },
    });
  });
  await page
    .getByRole("button", { name: "Voice conversation", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Start recording", exact: true })
  ).toBeDisabled();
  const consent = page.getByRole("checkbox", {
    name: /I consent to microphone capture/,
  });
  await consent.check();
  await page
    .getByRole("button", { name: "Start recording", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Finish recording", exact: true })
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Interrupt / stop", exact: true })
    .click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Interrupted" })
  ).toBeVisible();
  expect(transcriptions).toBe(0);
  await page
    .getByRole("button", { name: "Start recording", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Finish recording", exact: true })
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Finish recording", exact: true })
    .click();
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "Synthetic transcription unavailable" })
  ).toBeVisible();
  expect(transcriptions).toBe(1);
  await consent.uncheck();
  await expect(
    page.getByRole("button", { name: "Start recording", exact: true })
  ).toBeDisabled();
  expect(
    await page.evaluate(
      () =>
        (
          window as unknown as {
            syntheticAudio: { captures: number; stops: number };
          }
        ).syntheticAudio
    )
  ).toEqual({ captures: 2, stops: 2 });
});

test("mocked transcript is editable and consent revocation prevents submission; speech failure preserves text cards", async ({
  page,
}) => {
  await ownerLogin(page);
  await setup(page);
  await mockAudio(page);
  await page.route("**/api/voice", (route) =>
    route.fulfill({
      json: {
        available: true,
        mode: "turn-based",
        reason: "Synthetic boundary",
        maxSeconds: 10,
        maxSpeechCharacters: 1000,
      },
    })
  );
  await page.route("**/api/voice/transcribe", (route) =>
    route.fulfill({ json: { text: "Synthetic spoken request" } })
  );
  let speeches = 0;
  await page.route("**/api/voice/speak", (route) => {
    speeches++;
    return route.fulfill({
      status: 503,
      json: { error: "Synthetic audio reply unavailable" },
    });
  });
  await page
    .getByRole("button", { name: "Voice conversation", exact: true })
    .click();
  const consent = page.getByRole("checkbox", {
    name: /I consent to microphone capture/,
  });
  await consent.check();
  await page
    .getByRole("button", { name: "Start recording", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Finish recording", exact: true })
    .click();
  const transcript = page.getByRole("textbox", {
    name: "Voice transcript",
    exact: true,
  });
  await expect(transcript).toHaveValue("Synthetic spoken request");
  await transcript.fill("Show product catalog");
  await consent.uncheck();
  await expect(
    page.getByRole("button", { name: "Send transcript", exact: true })
  ).toBeDisabled();
  await consent.check();
  const before = await state(page.request);
  await page
    .getByRole("button", { name: "Send transcript", exact: true })
    .click();
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "Synthetic audio reply unavailable" })
  ).toBeVisible();
  await expect(
    page.getByText("Show product catalog", { exact: true })
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Add product", exact: true })
  ).toBeVisible();
  expect((await state(page.request)).revision).toBe(before.revision);
  expect(speeches).toBe(1);
});
