import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync } from "node:fs";
import { scryptSync } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  encodeVoiceWav,
  validateVoiceWav,
  VOICE_MAX_BYTES,
  speechText,
  recordVoice,
} from "../src/lib/voice";
import {
  speakVoice,
  transcribeVoice,
  voiceAvailability,
  requireVoiceConsent,
  readBoundedBody,
  TRANSCRIBE_RESERVATION_MICRO_USD,
  SPEAK_RESERVATION_MICRO_USD,
} from "../src/lib/voice-server";
import { GET as availabilityRoute } from "../src/app/api/voice/route";
import { POST as transcribeRoute } from "../src/app/api/voice/transcribe/route";
import { POST as speakRoute } from "../src/app/api/voice/speak/route";
import { createSession } from "../src/lib/auth";
import { authStore } from "../src/lib/auth-store";

const base = "http://127.0.0.1:4320";
const wav = () => encodeVoiceWav(new Float32Array(16000), 16000);
const audioRequest = (bytes = wav()) =>
  new Request(`${base}/api/voice/transcribe`, {
    method: "POST",
    headers: { "Content-Type": "audio/wav" },
    body: bytes,
  });
const request = () =>
  new Request(`${base}/api/voice/speak`, { method: "POST" });
const validEnv = {
  SHOP_AI_ENABLED: "true",
  SHOP_VOICE_ENABLED: "true",
  SHOP_VOICE_PRICING_REVIEWED: "2026-10-04",
  SHOP_AI_BUDGET_MICRO_USD: "100000",
  OPENAI_API_KEY: "test-not-a-real-key",
};

test("PCM duration is derived from exact server-validated bytes, not client metadata", () => {
  assert.equal(validateVoiceWav(wav()), 1);
  const maximum = encodeVoiceWav(new Float32Array(48000 * 20), 48000);
  assert.equal(maximum.byteLength, VOICE_MAX_BYTES);
  assert.equal(validateVoiceWav(maximum), 10);
  for (const offset of [0, 4, 8, 12, 16, 20, 22, 24, 28, 32, 34, 36, 40]) {
    const corrupted = wav();
    corrupted[offset] ^= 1;
    assert.throws(() => validateVoiceWav(corrupted));
  }
  assert.throws(() => validateVoiceWav(new Uint8Array(VOICE_MAX_BYTES + 2)));
  assert.throws(() => validateVoiceWav(new Uint8Array([1, 2, 3])));
  assert.throws(() => encodeVoiceWav(new Float32Array(10), 16000));
});

test("speech character ceiling cannot be exceeded by unicode or whitespace", () => {
  assert.equal(speechText(" hello "), "hello");
  assert.throws(() => speechText("x".repeat(1001)));
  assert.throws(() => speechText("😀".repeat(501)));
  assert.throws(() => speechText(" ".repeat(1001)));
  assert.throws(() => speechText({ text: "hello" }));
});

test("availability fails closed independently of credential presence", () => {
  assert.equal(
    voiceAvailability({ OPENAI_API_KEY: "present" }).available,
    false
  );
  assert.equal(voiceAvailability(validEnv).available, true);
  for (const field of [
    "SHOP_AI_ENABLED",
    "SHOP_VOICE_ENABLED",
    "SHOP_VOICE_PRICING_REVIEWED",
    "SHOP_AI_BUDGET_MICRO_USD",
    "OPENAI_API_KEY",
  ]) {
    assert.equal(
      voiceAvailability({ ...validEnv, [field]: undefined }).available,
      false
    );
  }
  // Authentication/configuration for hosted execution is checked by route auth,
  // not by a misleading permanent block inside paid availability configuration.
  assert.equal(voiceAvailability({ ...validEnv, VERCEL: "1" }).available, true);
  assert.equal(
    voiceAvailability({ ...validEnv, SHOP_AI_BUDGET_MICRO_USD: "1e9" })
      .available,
    false
  );
});

test("enabled voice still requires explicit consent and a bounded replay identifier", () => {
  assert.throws(() => requireVoiceConsent(request(), validEnv), /consent/);
  assert.throws(
    () =>
      requireVoiceConsent(
        new Request(base, { headers: { "X-Voice-Consent": "yes" } }),
        validEnv
      ),
    /request ID/
  );
  assert.throws(
    () =>
      requireVoiceConsent(
        new Request(base, {
          headers: { "X-Voice-Consent": "yes", "X-Request-Id": "x".repeat(91) },
        }),
        validEnv
      ),
    /request ID/
  );
  assert.equal(
    requireVoiceConsent(
      new Request(base, {
        headers: { "X-Voice-Consent": "yes", "X-Request-Id": "voice-turn-123" },
      }),
      validEnv
    ),
    "voice-turn-123"
  );
});

test("transcription reserves before provider call and returns only reviewable text", async () => {
  const calls: string[] = [];
  const result = await transcribeVoice(audioRequest(), "request-one", {
    apiKey: "test-not-a-real-key",
    reserve: async (id, amount) => {
      assert.equal(id, "voice-stt-request-one");
      assert.equal(amount, TRANSCRIBE_RESERVATION_MICRO_USD);
      calls.push("reserve");
    },
    fetch: async (url, options) => {
      calls.push("provider");
      assert.equal(url, "https://api.openai.com/v1/audio/transcriptions");
      assert.equal((options?.body as FormData).get("model"), "whisper-1");
      assert.equal((options?.body as FormData).get("language"), "en");
      assert.equal(
        (options?.body as FormData).get("file") instanceof Blob,
        true
      );
      return Response.json({ text: " Show my orders " });
    },
  });
  assert.equal(result, "Show my orders");
  assert.deepEqual(calls, ["reserve", "provider"]);
});

test("invalid, oversized, wrong-format and budget-denied audio never reaches provider", async () => {
  let calls = 0;
  let reservations = 0;
  const deps = {
    apiKey: "test",
    reserve: async () => {
      reservations++;
    },
    fetch: async () => {
      calls++;
      return Response.json({ text: "hello" });
    },
  };
  await assert.rejects(
    transcribeVoice(audioRequest(new Uint8Array(100)), "invalid", deps)
  );
  await assert.rejects(
    transcribeVoice(
      audioRequest(new Uint8Array(VOICE_MAX_BYTES + 1)),
      "large",
      deps
    )
  );
  await assert.rejects(
    transcribeVoice(
      new Request(base, {
        method: "POST",
        headers: { "Content-Type": "audio/webm" },
        body: wav(),
      }),
      "format",
      deps
    )
  );
  assert.equal(reservations, 0);
  assert.equal(calls, 0);
  await assert.rejects(
    transcribeVoice(audioRequest(), "denied", {
      ...deps,
      reserve: async () => {
        throw new Error("budget exhausted");
      },
    }),
    /budget exhausted/
  );
  assert.equal(calls, 0);
});

test("streamed body overflow rejects even without content-length", async () => {
  const response = new Request(base, {
    method: "POST",
    body: new Uint8Array(12),
  });
  await assert.rejects(readBoundedBody(response, 10), /too large/);
});

test("speech uses fixed model/voice and bound; client cannot select costlier models", async () => {
  const calls: string[] = [];
  const response = await speakVoice(
    "An order is ready to review.",
    request(),
    "speech-request",
    {
      apiKey: "test",
      reserve: async (_, amount) => {
        assert.equal(amount, SPEAK_RESERVATION_MICRO_USD);
        calls.push("reserve");
      },
      fetch: async (_, options) => {
        calls.push("provider");
        assert.deepEqual(JSON.parse(options!.body as string), {
          model: "tts-1",
          voice: "alloy",
          input: "An order is ready to review.",
          response_format: "mp3",
          speed: 1,
        });
        return new Response(new Uint8Array([1, 2, 3]));
      },
    }
  );
  assert.equal(response.headers.get("content-type"), "audio/mpeg");
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(calls, ["reserve", "provider"]);
});

test("failed and cancelled requests never retry or release their budget reservation", async () => {
  let reserved = 0;
  let sent = 0;
  const deps = {
    apiKey: "test",
    reserve: async () => {
      reserved++;
    },
    fetch: async () => {
      sent++;
      return new Response("provider detail must not leak", { status: 429 });
    },
  };
  await assert.rejects(
    speakVoice("hello", request(), "failure", deps),
    /Reservation retained/
  );
  assert.equal(reserved, 1);
  assert.equal(sent, 1);
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    speakVoice(
      "hello",
      new Request(base, { signal: controller.signal }),
      "cancelled",
      deps
    )
  );
  assert.equal(reserved, 1);
  assert.equal(sent, 1);
  await assert.rejects(
    speakVoice("x".repeat(1001), request(), "invalid", deps)
  );
  assert.equal(reserved, 1);
  assert.equal(sent, 1);
});

test("public voice routes require auth and same origin, and disabled routes never issue paid requests", async () => {
  const previousDb = process.env.SHOP_AUTH_DB_PATH;
  process.env.SHOP_AUTH_DB_PATH = join(
    mkdtempSync(join(tmpdir(), "shop-voice-test-")),
    "auth.sqlite"
  );
  const previous = process.env.SHOP_VOICE_ENABLED;
  delete process.env.SHOP_VOICE_ENABLED;
  try {
    assert.equal(
      (await availabilityRoute(new Request(`${base}/api/voice`))).status,
      401
    );
    assert.equal((await transcribeRoute(audioRequest())).status, 401);
    const cookie = (
      await createSession(
        new Request(`${base}/api/session`, { headers: { Origin: base } }),
        { mode: "preview" }
      )
    ).split(";")[0];
    const response = await availabilityRoute(
      new Request(`${base}/api/voice`, {
        headers: { Cookie: cookie, "X-Shop-Workspace": "preview" },
      })
    );
    assert.equal(response.status, 200);
    assert.equal((await response.json()).available, false);
    assert.equal(
      (
        await transcribeRoute(
          new Request(`${base}/api/voice/transcribe`, {
            method: "POST",
            headers: {
              Cookie: cookie,
              Origin: "https://evil.example",
              "Content-Type": "audio/wav",
            },
            body: wav(),
          })
        )
      ).status,
      403
    );
    assert.equal(
      (
        await transcribeRoute(
          new Request(`${base}/api/voice/transcribe`, {
            method: "POST",
            headers: {
              Cookie: cookie,
              Origin: base,
              "X-Shop-Workspace": "preview",
              "Content-Type": "audio/wav",
            },
            body: wav(),
          })
        )
      ).status,
      403
    );
    assert.equal(
      (
        await speakRoute(
          new Request(`${base}/api/voice/speak`, {
            method: "POST",
            headers: {
              Cookie: cookie,
              Origin: base,
              "X-Shop-Workspace": "preview",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ text: "test" }),
          })
        )
      ).status,
      403
    );
    assert.throws(() => requireVoiceConsent(request()), /disabled/);
    // Even enabled feature flags cannot grant free preview sessions paid access.
    process.env.SHOP_VOICE_ENABLED = "true";
    assert.equal(
      (
        await speakRoute(
          new Request(`${base}/api/voice/speak`, {
            method: "POST",
            headers: {
              Cookie: cookie,
              Origin: base,
              "X-Shop-Workspace": "preview",
              "Content-Type": "application/json",
              "X-Voice-Consent": "yes",
              "X-Request-Id": "preview-test-request",
            },
            body: JSON.stringify({ text: "test" }),
          })
        )
      ).status,
      403
    );
  } finally {
    await (await authStore()).close();
    if (previousDb === undefined) delete process.env.SHOP_AUTH_DB_PATH;
    else process.env.SHOP_AUTH_DB_PATH = previousDb;
    if (previous === undefined) delete process.env.SHOP_VOICE_ENABLED;
    else process.env.SHOP_VOICE_ENABLED = previous;
  }
});

test("stale preview voice UI with an owner cookie is rejected before any provider call or budget storage", async () => {
  const saved = { ...process.env };
  const originalFetch = globalThis.fetch;
  const folder = mkdtempSync(join(tmpdir(), "shop-voice-scope-"));
  let providerCalls = 0;
  try {
    Object.assign(process.env, validEnv, {
      SHOP_AUTH_DB_PATH: join(folder, "auth.sqlite"),
      SHOP_DB_PATH: join(folder, "budget-must-not-exist.sqlite"),
      SHOP_APP_ORIGIN: base,
      SHOP_SESSION_SECRET: "c".repeat(64),
      SHOP_OWNER_PASSWORD_HASH: `scrypt$${"a".repeat(32)}$${scryptSync("synthetic-voice-owner-fixture", Buffer.from("a".repeat(32), "hex"), 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }).toString("hex")}`,
    });
    delete process.env.DATABASE_URL;
    delete process.env.VERCEL;
    globalThis.fetch = async () => {
      providerCalls++;
      throw new Error("Real network is prohibited in this test");
    };
    const ownerCookie = (
      await createSession(
        new Request(`${base}/api/session`, { headers: { Origin: base } }),
        { mode: "shop", password: "synthetic-voice-owner-fixture" }
      )
    ).split(";")[0];
    for (const expected of ["preview", undefined]) {
      const headers: Record<string, string> = {
        Cookie: ownerCookie,
        Origin: base,
        "X-Voice-Consent": "yes",
        "X-Request-Id": "stale-voice-scope-test",
      };
      if (expected) headers["X-Shop-Workspace"] = expected;
      const status = await availabilityRoute(
        new Request(`${base}/api/voice`, { headers })
      );
      const transcription = await transcribeRoute(
        new Request(`${base}/api/voice/transcribe`, {
          method: "POST",
          headers: { ...headers, "Content-Type": "audio/wav" },
          body: wav(),
        })
      );
      const speech = await speakRoute(
        new Request(`${base}/api/voice/speak`, {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({ text: "Must not spend" }),
        })
      );
      for (const response of [status, transcription, speech]) {
        assert.equal(response.status, 409);
        assert.equal((await response.json()).code, "WORKSPACE_CHANGED");
      }
    }
    assert.equal(providerCalls, 0);
    assert.equal(
      existsSync(process.env.SHOP_DB_PATH!),
      false,
      "workspace rejection must happen before budget storage is opened"
    );
  } finally {
    await (await authStore()).close();
    globalThis.fetch = originalFetch;
    for (const key of Object.keys(process.env))
      if (!(key in saved)) delete process.env[key];
    Object.assign(process.env, saved);
  }
});

test("microphone tracks close on cancel and when permission resolves after cancellation (mocked devices only)", async () => {
  const priorNavigator = Object.getOwnPropertyDescriptor(
    globalThis,
    "navigator"
  );
  const priorWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const priorAudioContext = Object.getOwnPropertyDescriptor(
    globalThis,
    "AudioContext"
  );
  let stopped = 0;
  let closed = 0;
  const stream = {
    getTracks: () => [
      {
        stop: () => {
          stopped++;
        },
      },
    ],
  };
  class FakeContext {
    state = "running";
    sampleRate = 48000;
    destination = {};
    async resume() {}
    async close() {
      this.state = "closed";
      closed++;
    }
    createMediaStreamSource() {
      return { connect() {}, disconnect() {} };
    }
    createScriptProcessor() {
      return { onaudioprocess: null, connect() {}, disconnect() {} };
    }
    createGain() {
      return { gain: { value: 1 }, connect() {}, disconnect() {} };
    }
  }
  try {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { AudioContext: FakeContext },
    });
    Object.defineProperty(globalThis, "AudioContext", {
      configurable: true,
      value: FakeContext,
    });
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: { mediaDevices: { getUserMedia: async () => stream } },
    });
    const controller = new AbortController();
    const recording = await recordVoice(() => {}, controller.signal);
    recording.cancel();
    recording.cancel();
    assert.equal(stopped, 1);
    assert.equal(closed, 1);
    const late = new AbortController();
    late.abort();
    await assert.rejects(
      recordVoice(() => {}, late.signal),
      { name: "AbortError" }
    );
    assert.equal(stopped, 2);
  } finally {
    if (priorNavigator)
      Object.defineProperty(globalThis, "navigator", priorNavigator);
    else Reflect.deleteProperty(globalThis, "navigator");
    if (priorWindow) Object.defineProperty(globalThis, "window", priorWindow);
    else Reflect.deleteProperty(globalThis, "window");
    if (priorAudioContext)
      Object.defineProperty(globalThis, "AudioContext", priorAudioContext);
    else Reflect.deleteProperty(globalThis, "AudioContext");
  }
});
