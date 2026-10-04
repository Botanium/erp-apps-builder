/** Offline rendered-component regression; no server, microphone or provider access.
 * Run: PLAYWRIGHT_MODULE=/path/to/playwright node tests/voice-consent.browser.mjs
 * Uses existing esbuild (tsx dependency) and an installed Playwright runtime.
 */
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const appRoot = fileURLToPath(new URL("..", import.meta.url));
const bundle = await build({
  stdin: {
    contents: `import React from 'react'; import {createRoot} from 'react-dom/client'; import {VoiceControl} from './src/components/voice/VoiceControl'; const root = createRoot(document.getElementById('root')); window.renderVoiceScope = (workspace) => root.render(<VoiceControl workspace={workspace} onWorkspaceChanged={() => {window.voiceProof.workspaceChanged++;}} onIntent={(message, signal) => window.mockIntent(message, signal)} />); window.renderVoiceScope('shop');`,
    resolveDir: appRoot,
    loader: "tsx",
  },
  bundle: true,
  write: false,
  platform: "browser",
  format: "iife",
  jsx: "automatic",
});
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_EXECUTABLE
    ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE }
    : {}),
});
try {
  const page = await browser.newPage();
  page.setDefaultTimeout(5_000);
  page.on("pageerror", (error) =>
    console.error("Offline harness browser error:", error.message)
  );
  await page.route("**/*", (route) => route.abort()); // Network is prohibited for this test.
  await page.setContent('<html><body><div id="root"></div></body></html>');
  await page.evaluate(() => {
    if (!crypto.randomUUID)
      Object.defineProperty(crypto, "randomUUID", {
        value: () => `mock-turn-${Math.random().toString(36).slice(2)}`,
      });
    window.voiceProof = {
      transcription: 0,
      speech: 0,
      intents: 0,
      stoppedTracks: 0,
      played: 0,
      abortedIntents: 0,
      workspaceChanged: 0,
      headers: [],
    };
    window.mismatchPath = null;
    window.pendingReply = null;
    window.mockIntent = (_, signal) => {
      window.voiceProof.intents++;
      signal.addEventListener(
        "abort",
        () => {
          window.voiceProof.abortedIntents++;
        },
        { once: true }
      );
      return new Promise((resolve) => {
        window.pendingReply = resolve;
      });
    };
    window.fetch = async (path, init) => {
      const expectedWorkspace = new Headers(init?.headers).get(
        "X-Shop-Workspace"
      );
      window.voiceProof.headers.push({ path, workspace: expectedWorkspace });
      if (window.mismatchPath === path)
        return Response.json(
          { error: "Workspace changed", code: "WORKSPACE_CHANGED" },
          { status: 409 }
        );
      if (path === "/api/voice")
        return Response.json({
          available: true,
          mode: "turn-based",
          reason: "Offline fixture",
          maxSeconds: 10,
          maxSpeechCharacters: 1000,
        });
      if (path === "/api/voice/transcribe") {
        window.voiceProof.transcription++;
        return Response.json({ text: "Show my orders" });
      }
      if (path === "/api/voice/speak") {
        window.voiceProof.speech++;
        return new Response(new Uint8Array([1, 2, 3]), {
          headers: { "Content-Type": "audio/mpeg" },
        });
      }
      throw new Error("Unexpected network request");
    };
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: async () => ({
          getTracks: () => [
            {
              stop: () => {
                window.voiceProof.stoppedTracks++;
              },
            },
          ],
        }),
      },
    });
    window.AudioContext = class {
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
      createScriptProcessor() {
        let callback = null;
        return {
          set onaudioprocess(value) {
            callback = value;
            if (value)
              queueMicrotask(() =>
                callback?.({
                  inputBuffer: {
                    getChannelData: () => new Float32Array(16000),
                  },
                })
              );
          },
          connect() {},
          disconnect() {},
        };
      }
      createGain() {
        return { gain: { value: 1 }, connect() {}, disconnect() {} };
      }
    };
    window.Audio = class {
      async play() {
        window.voiceProof.played++;
      }
      pause() {}
    };
  });
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
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
  await page.getByRole("textbox", { name: "Voice transcript" }).waitFor();
  await consent.uncheck();
  assert.equal(
    await page
      .getByRole("button", { name: "Send transcript", exact: true })
      .isDisabled(),
    true
  );
  let proof = await page.evaluate(() => window.voiceProof);
  assert.deepEqual(
    {
      transcription: proof.transcription,
      speech: proof.speech,
      intents: proof.intents,
      stoppedTracks: proof.stoppedTracks,
    },
    { transcription: 1, speech: 0, intents: 0, stoppedTracks: 1 }
  );

  // Withdraw while the shared text handler is pending; its late completion must
  // never trigger speech using consent captured by an older React render.
  await consent.check();
  await page
    .getByRole("button", { name: "Send transcript", exact: true })
    .click();
  await page.waitForFunction(() => window.voiceProof.intents === 1);
  assert.equal(
    await page
      .getByRole("checkbox", { name: /Read replies aloud/ })
      .isDisabled(),
    true
  );
  await consent.uncheck();
  await page.evaluate(() =>
    window.pendingReply("The orders are ready to review.")
  );
  await page
    .getByRole("alert")
    .filter({ hasText: "Voice consent withdrawn" })
    .waitFor();
  proof = await page.evaluate(() => window.voiceProof);
  assert.equal(proof.speech, 0);
  assert.equal(proof.played, 0);
  assert.equal(proof.abortedIntents, 1);

  // Withdrawal while recording closes tracks and submits no additional upload.
  await consent.check();
  await page
    .getByRole("button", { name: "Start recording", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Finish recording", exact: true })
    .waitFor();
  await consent.uncheck();
  proof = await page.evaluate(() => window.voiceProof);
  assert.equal(proof.stoppedTracks, 2);
  assert.equal(proof.transcription, 1);
  assert.equal(proof.speech, 0);

  // A cookie switch in another tab is reported by the server. The stale voice
  // turn must stop, clear its consent/transcript, notify the parent and not retry.
  await page.evaluate(() => {
    window.mismatchPath = "/api/voice/transcribe";
  });
  await consent.check();
  await page
    .getByRole("button", { name: "Start recording", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Finish recording", exact: true })
    .click();
  await page
    .getByRole("alert")
    .filter({ hasText: "signed-in workspace changed" })
    .waitFor();
  assert.equal(await consent.isChecked(), false);
  assert.equal(
    await page.getByRole("textbox", { name: "Voice transcript" }).count(),
    0
  );
  proof = await page.evaluate(() => window.voiceProof);
  assert.equal(proof.workspaceChanged, 1);
  assert.equal(proof.transcription, 1);
  assert.equal(proof.speech, 0);
  assert.equal(
    proof.headers.filter((item) => item.path === "/api/voice/transcribe")
      .length,
    2
  );

  // After an explicit new check/start, a later speech mismatch is equally
  // rejected; there is no retry or automatic move into the new cookie's scope.
  await page.evaluate(() => {
    window.mismatchPath = null;
  });
  await page
    .getByRole("button", { name: "Check availability", exact: true })
    .click();
  await consent.check();
  await page
    .getByRole("button", { name: "Start recording", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Finish recording", exact: true })
    .click();
  await page.getByRole("textbox", { name: "Voice transcript" }).waitFor();
  await page
    .getByRole("button", { name: "Send transcript", exact: true })
    .click();
  await page.waitForFunction(() => window.voiceProof.intents === 2);
  await page.evaluate(() => {
    window.mismatchPath = "/api/voice/speak";
    window.pendingReply("Current text reply");
  });
  await page.waitForFunction(() => window.voiceProof.workspaceChanged === 2);
  assert.equal(await consent.isChecked(), false);
  proof = await page.evaluate(() => window.voiceProof);
  assert.equal(proof.speech, 0);
  assert.equal(proof.played, 0);
  assert.equal(
    proof.headers.filter((item) => item.path === "/api/voice/speak").length,
    1
  );
  assert.equal(
    proof.headers.every((item) => item.workspace === "shop"),
    true
  );

  // A rendered-workspace change also aborts a pending reply; a late resolved
  // handler from the old scope must not request or play audio in the new scope.
  await page.evaluate(() => {
    window.mismatchPath = null;
  });
  await page
    .getByRole("button", { name: "Check availability", exact: true })
    .click();
  await consent.check();
  await page
    .getByRole("button", { name: "Start recording", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Finish recording", exact: true })
    .click();
  await page.getByRole("textbox", { name: "Voice transcript" }).waitFor();
  await page
    .getByRole("button", { name: "Send transcript", exact: true })
    .click();
  await page.waitForFunction(() => window.voiceProof.intents === 3);
  await page.evaluate(() => window.renderVoiceScope("preview"));
  await page.waitForFunction(() => window.voiceProof.abortedIntents === 3);
  await page.evaluate(async () => {
    window.pendingReply("Stale shop reply");
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
  assert.equal(await consent.isChecked(), false);
  assert.equal(
    await page.getByRole("textbox", { name: "Voice transcript" }).count(),
    0
  );
  await page
    .getByRole("button", { name: "Check availability", exact: true })
    .click();
  proof = await page.evaluate(() => window.voiceProof);
  assert.equal(proof.headers.at(-1).workspace, "preview");
  assert.equal(
    proof.headers.filter((item) => item.path === "/api/voice/speak").length,
    1
  );
  assert.equal(proof.speech, 0);
  assert.equal(proof.played, 0);
  console.log(
    JSON.stringify({
      result: "PASS",
      cases: [
        "withdraw-before-send",
        "withdraw-during-reply",
        "withdraw-during-recording",
        "transcription-workspace-mismatch",
        "speech-workspace-mismatch",
        "late-reply-after-rendered-workspace-change",
      ],
      ...proof,
    })
  );
} finally {
  await browser.close();
}
