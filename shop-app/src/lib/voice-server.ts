import { HttpError } from "./auth";
import {
  VOICE_MAX_BYTES,
  VOICE_MAX_SECONDS,
  VOICE_MAX_TEXT,
  speechText,
  validateVoiceWav,
  type VoiceAvailability,
} from "./voice";

// Reviewed official pricing 2026-10-04: whisper-1 $0.006/min; tts-1 $15/1M chars.
// Reserve a FULL minute even for <=10 s; TTS reserve exceeds max 1000-char price.
// These are retained reservations, not a promise of exact provider invoice amounts.
export const TRANSCRIBE_RESERVATION_MICRO_USD = 6_000;
export const SPEAK_RESERVATION_MICRO_USD = 20_000;
export const VOICE_PRICING_REVIEW_DATE = "2026-10-04";
type Environment = Record<string, string | undefined>;
export function voiceAvailability(
  env: Environment = process.env
): VoiceAvailability {
  let reason =
    "Ready for short, turn-based voice. Microphone starts only after explicit consent and a click.";
  // All public routes validate durable owner/shop auth and trusted origin first,
  // including hosted configuration. Availability here describes paid runtime gates only.
  if (env.SHOP_AI_ENABLED !== "true" || env.SHOP_VOICE_ENABLED !== "true")
    reason =
      "Voice is implemented but paid voice usage is disabled. Text preview remains available; no microphone is opened.";
  else if (env.SHOP_VOICE_PRICING_REVIEWED !== VOICE_PRICING_REVIEW_DATE)
    reason =
      "Voice requires an explicit server-side pricing review before paid use.";
  else if (!env.OPENAI_API_KEY)
    reason = "Voice provider credential is not configured.";
  else if (
    !/^\d+$/.test(env.SHOP_AI_BUDGET_MICRO_USD || "") ||
    Number(env.SHOP_AI_BUDGET_MICRO_USD) < TRANSCRIBE_RESERVATION_MICRO_USD ||
    Number(env.SHOP_AI_BUDGET_MICRO_USD) > 10_000_000
  )
    reason = "Voice requires a positive approved shared AI budget.";
  else
    return {
      available: true,
      mode: "turn-based",
      reason,
      maxSeconds: VOICE_MAX_SECONDS,
      maxSpeechCharacters: VOICE_MAX_TEXT,
    };
  return {
    available: false,
    mode: "turn-based",
    reason,
    maxSeconds: VOICE_MAX_SECONDS,
    maxSpeechCharacters: VOICE_MAX_TEXT,
  };
}

export function requireVoiceConsent(
  request: Request,
  environment: Environment = process.env
): string {
  const availability = voiceAvailability(environment);
  if (!availability.available)
    throw new HttpError(503, availability.reason, "VOICE_DISABLED");
  if (request.headers.get("x-voice-consent") !== "yes")
    throw new HttpError(
      400,
      "Explicit paid voice consent is required for this request.",
      "VOICE_CONSENT_REQUIRED"
    );
  const requestId = request.headers.get("x-request-id") || "";
  if (!/^[a-zA-Z0-9_-]{8,90}$/.test(requestId))
    throw new HttpError(400, "A unique voice request ID is required.");
  return requestId;
}

export async function readBoundedBody(
  request: Request,
  limit: number
): Promise<Uint8Array<ArrayBuffer>> {
  const declared = request.headers.get("content-length");
  if (
    declared !== null &&
    (!/^\d+$/.test(declared) || Number(declared) > limit)
  )
    throw new HttpError(413, "Voice request is too large.");
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "Audio body required.");
  const parts: Uint8Array[] = [];
  let length = 0;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    length += value.length;
    if (length > limit) {
      await reader.cancel();
      throw new HttpError(413, "Voice request is too large.");
    }
    parts.push(value);
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    bytes.set(part, offset);
    offset += part.length;
  }
  return bytes;
}

type VoiceDependencies = {
  /** Shared durable text/voice ledger. A reservation is never refunded on cancellation or unknown outcomes. */
  reserve: (id: string, amount: number) => Promise<void>;
  apiKey: string;
  fetch: typeof fetch;
};

async function reserve(
  dependencies: VoiceDependencies,
  id: string,
  amount: number,
  signal: AbortSignal
) {
  signal.throwIfAborted();
  try {
    await dependencies.reserve(id, amount);
  } catch {
    throw new HttpError(
      409,
      "Shared AI budget exhausted or this voice request was already reserved. No provider request was sent.",
      "VOICE_BUDGET_REJECTED"
    );
  }
  signal.throwIfAborted();
}
function providerSignal(signal: AbortSignal) {
  return AbortSignal.any([signal, AbortSignal.timeout(30_000)]);
}

export async function transcribeVoice(
  request: Request,
  requestId: string,
  dependencies: VoiceDependencies
): Promise<string> {
  if (request.headers.get("content-type") !== "audio/wav")
    throw new HttpError(415, "Only canonical audio/wav is accepted.");
  const bytes = await readBoundedBody(request, VOICE_MAX_BYTES);
  try {
    validateVoiceWav(bytes);
  } catch {
    throw new HttpError(
      400,
      "Invalid audio: expected 0.1–10 seconds of mono PCM16 WAV at 16 kHz."
    );
  }
  await reserve(
    dependencies,
    `voice-stt-${requestId}`,
    TRANSCRIBE_RESERVATION_MICRO_USD,
    request.signal
  );
  const form = new FormData();
  form.set("model", "whisper-1");
  form.set("language", "en");
  form.set("response_format", "json");
  form.set("file", new Blob([bytes], { type: "audio/wav" }), "utterance.wav");
  const response = await dependencies.fetch(
    "https://api.openai.com/v1/audio/transcriptions",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${dependencies.apiKey}` },
      body: form,
      signal: providerSignal(request.signal),
    }
  );
  if (!response.ok) {
    await response.body?.cancel();
    throw new HttpError(
      502,
      "Voice transcription provider rejected the request. Reservation retained; no automatic retry.",
      "VOICE_PROVIDER_FAILED"
    );
  }
  const result = (await response.json()) as { text?: unknown };
  if (
    typeof result.text !== "string" ||
    !result.text.trim() ||
    result.text.length > 2000
  )
    throw new HttpError(
      502,
      "No usable short transcript was returned. Reservation retained."
    );
  return result.text.trim();
}

export async function speakVoice(
  text: unknown,
  request: Request,
  requestId: string,
  dependencies: VoiceDependencies
): Promise<Response> {
  let input: string;
  try {
    input = speechText(text);
  } catch {
    throw new HttpError(
      400,
      `Speech text must contain 1–${VOICE_MAX_TEXT} characters.`
    );
  }
  await reserve(
    dependencies,
    `voice-tts-${requestId}`,
    SPEAK_RESERVATION_MICRO_USD,
    request.signal
  );
  const response = await dependencies.fetch(
    "https://api.openai.com/v1/audio/speech",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${dependencies.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "tts-1",
        voice: "alloy",
        input,
        response_format: "mp3",
        speed: 1,
      }),
      signal: providerSignal(request.signal),
    }
  );
  if (!response.ok || !response.body) {
    await response.body?.cancel();
    throw new HttpError(
      502,
      "Speech provider rejected the request. The text answer remains available. Reservation retained; no automatic retry.",
      "VOICE_PROVIDER_FAILED"
    );
  }
  return new Response(response.body, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
