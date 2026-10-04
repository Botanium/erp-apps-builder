/** Browser-safe voice format. A strict PCM format makes server duration verifiable. */
export const VOICE_SAMPLE_RATE = 16_000;
export const VOICE_MAX_SECONDS = 10;
export const VOICE_MAX_BYTES = 44 + VOICE_SAMPLE_RATE * VOICE_MAX_SECONDS * 2;
export const VOICE_MAX_TEXT = 1_000;
export type VoiceAvailability = {
  available: boolean;
  mode: "turn-based";
  reason: string;
  maxSeconds: number;
  maxSpeechCharacters: number;
};

export function encodeVoiceWav(
  samples: Float32Array,
  sampleRate: number
): Uint8Array<ArrayBuffer> {
  if (
    !Number.isFinite(sampleRate) ||
    sampleRate < VOICE_SAMPLE_RATE ||
    sampleRate > 192_000
  )
    throw new Error("Unsupported microphone sample rate.");
  const count = Math.min(
    Math.floor((samples.length * VOICE_SAMPLE_RATE) / sampleRate),
    VOICE_SAMPLE_RATE * VOICE_MAX_SECONDS
  );
  if (count < VOICE_SAMPLE_RATE / 10)
    throw new Error("Record at least a moment of speech.");
  const bytes = new Uint8Array(44 + count * 2);
  const view = new DataView(bytes.buffer);
  const label = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++)
      view.setUint8(offset + i, text.charCodeAt(i));
  };
  label(0, "RIFF");
  view.setUint32(4, bytes.length - 8, true);
  label(8, "WAVE");
  label(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, VOICE_SAMPLE_RATE, true);
  view.setUint32(28, VOICE_SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  label(36, "data");
  view.setUint32(40, count * 2, true);
  // Average source samples when downsampling to suppress aliasing; never retain raw audio.
  for (let i = 0; i < count; i++) {
    const start = Math.floor((i * sampleRate) / VOICE_SAMPLE_RATE);
    const end = Math.min(
      samples.length,
      Math.max(
        start + 1,
        Math.floor(((i + 1) * sampleRate) / VOICE_SAMPLE_RATE)
      )
    );
    let sum = 0;
    for (let j = start; j < end; j++) sum += samples[j];
    const value = Math.max(-1, Math.min(1, sum / (end - start)));
    view.setInt16(44 + i * 2, value < 0 ? value * 32768 : value * 32767, true);
  }
  return bytes;
}

/** Accept only our canonical header: compressed audio/extra chunks/forged lengths are rejected. */
export function validateVoiceWav(bytes: Uint8Array): number {
  const invalid = () => {
    throw new Error(
      "Expected 0.1–10 seconds of mono 16-bit PCM WAV at 16 kHz."
    );
  };
  if (
    bytes.length < 44 + 3200 ||
    bytes.length > VOICE_MAX_BYTES ||
    bytes.length % 2 !== 0
  )
    return invalid();
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const label = (offset: number, value: string) =>
    [...value].every(
      (char, i) => view.getUint8(offset + i) === char.charCodeAt(0)
    );
  if (
    !label(0, "RIFF") ||
    !label(8, "WAVE") ||
    !label(12, "fmt ") ||
    !label(36, "data") ||
    view.getUint32(4, true) !== bytes.length - 8 ||
    view.getUint32(16, true) !== 16 ||
    view.getUint16(20, true) !== 1 ||
    view.getUint16(22, true) !== 1 ||
    view.getUint32(24, true) !== VOICE_SAMPLE_RATE ||
    view.getUint32(28, true) !== VOICE_SAMPLE_RATE * 2 ||
    view.getUint16(32, true) !== 2 ||
    view.getUint16(34, true) !== 16 ||
    view.getUint32(40, true) !== bytes.length - 44
  )
    return invalid();
  return (bytes.length - 44) / (VOICE_SAMPLE_RATE * 2);
}

export function speechText(value: unknown): string {
  if (
    typeof value !== "string" ||
    !value.trim() ||
    value.length > VOICE_MAX_TEXT
  )
    throw new Error(`Speech must contain 1–${VOICE_MAX_TEXT} characters.`);
  return value.trim();
}

export type VoiceRecording = {
  finish: () => Promise<Uint8Array<ArrayBuffer>>;
  cancel: () => void;
};
/** Must be called from an explicit user gesture after availability and consent checks. */
export async function recordVoice(
  onLimit: () => void,
  signal: AbortSignal
): Promise<VoiceRecording> {
  if (!navigator.mediaDevices?.getUserMedia || !window.AudioContext)
    throw new Error(
      "Microphone capture requires a supported browser and a secure origin."
    );
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
    video: false,
  });
  const stopTracks = () => stream.getTracks().forEach((track) => track.stop());
  if (signal.aborted) {
    stopTracks();
    throw new DOMException("Cancelled", "AbortError");
  }
  let context: AudioContext | undefined;
  let source: MediaStreamAudioSourceNode | undefined;
  let processor: ScriptProcessorNode | undefined;
  let mute: GainNode | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let ended = false;
  const chunks: Float32Array[] = [];
  let length = 0;
  const cleanup = () => {
    if (ended) return;
    ended = true;
    clearTimeout(timer);
    signal.removeEventListener("abort", cleanup);
    if (processor) {
      processor.onaudioprocess = null;
      processor.disconnect();
    }
    source?.disconnect();
    mute?.disconnect();
    stopTracks();
    if (context && context.state !== "closed") void context.close();
  };
  try {
    context = new AudioContext();
    await context.resume();
    if (signal.aborted) throw new DOMException("Cancelled", "AbortError");
    source = context.createMediaStreamSource(stream);
    // Broad browser compatibility; bounded buffer and muted destination. No external worklet script.
    processor = context.createScriptProcessor(2048, 1, 1);
    mute = context.createGain();
    mute.gain.value = 0;
    const maxSamples = Math.floor(context.sampleRate * VOICE_MAX_SECONDS);
    processor.onaudioprocess = (event) => {
      if (ended) return;
      const input = event.inputBuffer.getChannelData(0);
      const count = Math.min(input.length, maxSamples - length);
      if (count > 0) {
        chunks.push(input.slice(0, count));
        length += count;
      }
      if (length >= maxSamples) {
        clearTimeout(timer);
        onLimit();
      }
    };
    source.connect(processor);
    processor.connect(mute);
    mute.connect(context.destination);
    signal.addEventListener("abort", cleanup, { once: true });
    timer = setTimeout(onLimit, VOICE_MAX_SECONDS * 1000);
    return {
      cancel: () => {
        cleanup();
        chunks.length = 0;
      },
      finish: async () => {
        if (ended) throw new DOMException("Cancelled", "AbortError");
        const rate = context!.sampleRate;
        cleanup();
        const samples = new Float32Array(length);
        let offset = 0;
        for (const chunk of chunks) {
          samples.set(chunk, offset);
          offset += chunk.length;
        }
        chunks.length = 0;
        return encodeVoiceWav(samples, rate);
      },
    };
  } catch (error) {
    cleanup();
    throw error;
  }
}
