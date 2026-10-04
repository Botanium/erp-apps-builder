"use client";

import { useEffect, useRef, useState } from "react";
import {
  recordVoice,
  VOICE_MAX_TEXT,
  type VoiceAvailability,
  type VoiceRecording,
} from "../../lib/voice";

type Workspace = "preview" | "shop";
type Props = {
  workspace: Workspace;
  disabled?: boolean;
  onWorkspaceChanged?: () => void;
  onIntent: (message: string, signal?: AbortSignal) => Promise<string | void>;
};
type Phase =
  | "idle"
  | "starting"
  | "recording"
  | "transcribing"
  | "review"
  | "thinking"
  | "speaking";

export function VoiceControl({
  workspace,
  disabled = false,
  onWorkspaceChanged,
  onIntent,
}: Props) {
  const scopeRef = useRef(workspace);
  scopeRef.current = workspace;
  const turnScope = useRef<Workspace>(workspace);
  const [open, setOpen] = useState(false);
  const [availability, setAvailability] = useState<VoiceAvailability | null>(
    null
  );
  const [consent, setConsent] = useState(false);
  // Async turns must consult current consent, never the render that started them.
  const consentRef = useRef(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const [readAloud, setReadAloud] = useState(true);
  const operation = useRef<AbortController | null>(null);
  const recording = useRef<VoiceRecording | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const audioUrl = useRef<string | null>(null);
  const busy = useRef(false);
  const mounted = useRef(true);
  const finishRef = useRef<() => void>(() => {});
  const availabilityEpoch = useRef(0);

  function cleanup() {
    availabilityEpoch.current++;
    operation.current?.abort();
    operation.current = null;
    recording.current?.cancel();
    recording.current = null;
    if (audio.current) {
      audio.current.pause();
      audio.current.src = "";
      audio.current = null;
    }
    if (audioUrl.current) {
      URL.revokeObjectURL(audioUrl.current);
      audioUrl.current = null;
    }
    busy.current = false;
  }
  useEffect(() => {
    mounted.current = true;
    const visibility = () => {
      if (document.hidden) {
        cleanup();
        setPhase("idle");
      }
    };
    document.addEventListener("visibilitychange", visibility);
    return () => {
      mounted.current = false;
      cleanup();
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  useEffect(() => {
    cleanup();
    consentRef.current = false;
    setConsent(false);
    setTranscript("");
    setAvailability(null);
    setPhase("idle");
    setError("");
  }, [workspace]);

  function workspaceChanged() {
    cleanup();
    consentRef.current = false;
    if (!mounted.current) return;
    setConsent(false);
    setTranscript("");
    setAvailability(null);
    setPhase("idle");
    setError(
      "The signed-in workspace changed. Voice was stopped without retry. Refresh the workspace and review it before starting a new turn."
    );
    onWorkspaceChanged?.();
  }

  async function checkAvailability() {
    const expectedWorkspace = workspace;
    const epoch = ++availabilityEpoch.current;
    setError("");
    try {
      const response = await fetch("/api/voice", {
        cache: "no-store",
        headers: { "X-Shop-Workspace": expectedWorkspace },
      });
      const data = await response.json();
      if (
        !mounted.current ||
        scopeRef.current !== expectedWorkspace ||
        epoch !== availabilityEpoch.current
      )
        return null;
      if (response.status === 409 && data.code === "WORKSPACE_CHANGED") {
        workspaceChanged();
        return null;
      }
      if (!response.ok)
        throw new Error(
          data.error || "Voice availability could not be checked."
        );
      if (mounted.current) setAvailability(data);
      return data as VoiceAvailability;
    } catch (caught) {
      if (
        mounted.current &&
        scopeRef.current === expectedWorkspace &&
        epoch === availabilityEpoch.current
      )
        setError(
          caught instanceof Error ? caught.message : "Voice unavailable."
        );
      return null;
    }
  }
  function cancel() {
    cleanup();
    setPhase("idle");
    setError(
      "Interrupted. Any submitted provider request may still be charged; its budget reservation is retained."
    );
  }
  function changeConsent(approved: boolean) {
    consentRef.current = approved;
    setConsent(approved);
    if (!approved) {
      cleanup();
      setPhase(phase === "review" ? "review" : "idle");
      setError(
        "Voice consent withdrawn. No new voice requests will be sent. Requests already submitted may still be charged; reservations are retained."
      );
    }
  }
  function headers(id: string, expectedWorkspace: Workspace) {
    if (!consentRef.current)
      throw new DOMException("Voice consent withdrawn", "AbortError");
    if (scopeRef.current !== expectedWorkspace)
      throw new DOMException("Workspace changed", "AbortError");
    return {
      "X-Voice-Consent": "yes",
      "X-Request-Id": id,
      "X-Shop-Workspace": expectedWorkspace,
    };
  }
  async function finish() {
    const captured = recording.current;
    const controller = operation.current;
    const expectedWorkspace = turnScope.current;
    if (
      !consentRef.current ||
      !captured ||
      !controller ||
      controller.signal.aborted
    )
      return;
    recording.current = null;
    setPhase("transcribing");
    try {
      const bytes = await captured.finish();
      if (
        !consentRef.current ||
        controller.signal.aborted ||
        scopeRef.current !== expectedWorkspace
      )
        return;
      const response = await fetch("/api/voice/transcribe", {
        method: "POST",
        headers: {
          ...headers(crypto.randomUUID(), expectedWorkspace),
          "Content-Type": "audio/wav",
        },
        body: new Blob([bytes], { type: "audio/wav" }),
        signal: controller.signal,
      });
      const data = await response.json();
      if (
        controller.signal.aborted ||
        !mounted.current ||
        scopeRef.current !== expectedWorkspace
      )
        return;
      if (response.status === 409 && data.code === "WORKSPACE_CHANGED") {
        workspaceChanged();
        return;
      }
      if (!response.ok) throw new Error(data.error || "Transcription failed.");
      if (!controller.signal.aborted && mounted.current) {
        setTranscript(data.text);
        setPhase("review");
        busy.current = false;
      }
    } catch (caught) {
      if (!controller.signal.aborted && mounted.current) {
        cleanup();
        setPhase("idle");
        setError(
          caught instanceof Error ? caught.message : "Transcription failed."
        );
      }
    }
  }
  finishRef.current = () => {
    void finish();
  };
  async function start() {
    if (busy.current || disabled || !consentRef.current) return;
    cleanup();
    busy.current = true;
    setError("");
    setTranscript("");
    setPhase("starting");
    const controller = new AbortController();
    operation.current = controller;
    const expectedWorkspace = workspace;
    turnScope.current = expectedWorkspace;
    const current = await checkAvailability();
    if (
      !consentRef.current ||
      controller.signal.aborted ||
      !mounted.current ||
      scopeRef.current !== expectedWorkspace
    )
      return;
    if (!current?.available) {
      cleanup();
      setPhase("idle");
      return;
    }
    try {
      const captured = await recordVoice(
        () => finishRef.current(),
        controller.signal
      );
      if (
        controller.signal.aborted ||
        !mounted.current ||
        scopeRef.current !== expectedWorkspace
      ) {
        captured.cancel();
        return;
      }
      recording.current = captured;
      setPhase("recording");
    } catch (caught) {
      if (!controller.signal.aborted && mounted.current) {
        cleanup();
        setPhase("idle");
        setError(
          caught instanceof Error
            ? caught.message
            : "Microphone permission was not granted."
        );
      }
    }
  }
  async function send() {
    if (busy.current || disabled || !consentRef.current || !transcript.trim())
      return;
    cleanup();
    busy.current = true;
    setError("");
    setPhase("thinking");
    const controller = new AbortController();
    operation.current = controller;
    const expectedWorkspace = workspace;
    turnScope.current = expectedWorkspace;
    try {
      // Same text conversation, app-owned cards and explicit human command confirmation.
      // The audio endpoint never gets access to the business command engine.
      const reply = await onIntent(transcript.trim(), controller.signal);
      if (
        !consentRef.current ||
        controller.signal.aborted ||
        !mounted.current ||
        scopeRef.current !== expectedWorkspace
      )
        return;
      setTranscript("");
      if (readAloud && typeof reply === "string" && reply.trim()) {
        const response = await fetch("/api/voice/speak", {
          method: "POST",
          headers: {
            ...headers(crypto.randomUUID(), expectedWorkspace),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: reply.slice(0, VOICE_MAX_TEXT) }),
          signal: controller.signal,
        });
        if (!response.ok) {
          const data = await response.json();
          if (
            controller.signal.aborted ||
            !mounted.current ||
            scopeRef.current !== expectedWorkspace
          )
            return;
          if (response.status === 409 && data.code === "WORKSPACE_CHANGED") {
            workspaceChanged();
            return;
          }
          throw new Error(
            data.error ||
              "Audio reply unavailable; the text reply remains in your conversation."
          );
        }
        const blob = await response.blob();
        if (
          !consentRef.current ||
          controller.signal.aborted ||
          !mounted.current ||
          scopeRef.current !== expectedWorkspace
        )
          return;
        audioUrl.current = URL.createObjectURL(blob);
        const player = new Audio(audioUrl.current);
        audio.current = player;
        player.onended = () => {
          cleanup();
          if (mounted.current) setPhase("idle");
        };
        player.onerror = () => {
          cleanup();
          if (mounted.current) {
            setPhase("idle");
            setError(
              "Audio playback failed. Your text reply is still available."
            );
          }
        };
        setPhase("speaking");
        await player.play();
      } else {
        cleanup();
        setPhase("idle");
      }
    } catch (caught) {
      if (!controller.signal.aborted && mounted.current) {
        cleanup();
        setPhase("idle");
        setError(
          caught instanceof Error ? caught.message : "Voice request failed."
        );
      }
    }
  }

  return (
    <div style={{ width: "100%" }}>
      <button
        type="button"
        className="button secondary small"
        aria-expanded={open}
        onClick={() => {
          if (open) cleanup();
          setOpen(!open);
          setPhase("idle");
          if (!open) void checkAvailability();
        }}
      >
        Voice conversation
      </button>
      {open && (
        <section
          aria-label="Turn-based voice conversation"
          style={{
            marginTop: 12,
            padding: 16,
            border: "1px solid var(--line, #d9e2df)",
            borderRadius: 12,
            display: "grid",
            gap: 12,
          }}
        >
          <div>
            <strong>Turn-based voice</strong>
            <p style={{ margin: "5px 0", fontSize: 13 }}>
              Speak for up to 10 seconds, review the transcript, then send.
              Replies use an AI-generated voice. This is not an always-listening
              Realtime session.
            </p>
          </div>
          <div role="status" style={{ fontSize: 13 }}>
            {availability?.available
              ? `Voice ready · ${phase}`
              : availability?.reason || "Checking voice availability…"}
          </div>
          {error && (
            <p role="alert" style={{ margin: 0, fontSize: 13 }}>
              {error}
            </p>
          )}
          <label
            style={{
              fontSize: 13,
              display: "flex",
              gap: 8,
              alignItems: "flex-start",
            }}
          >
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => changeConsent(event.target.checked)}
            />
            I consent to microphone capture and sending each short recording and
            spoken reply text to OpenAI using the approved shared budget. Do not
            include private customer details.
          </label>
          <label style={{ fontSize: 13 }}>
            <input
              type="checkbox"
              checked={readAloud}
              disabled={busy.current}
              onChange={(event) => setReadAloud(event.target.checked)}
            />{" "}
            Read replies aloud (up to 1,000 characters)
          </label>
          {phase === "review" && (
            <label style={{ display: "grid", gap: 6, fontSize: 13 }}>
              Review transcript — nothing has been submitted to the shop
              assistant yet
              <textarea
                aria-label="Voice transcript"
                value={transcript}
                maxLength={2000}
                rows={3}
                onChange={(event) => setTranscript(event.target.value)}
                style={{ width: "100%", padding: 10, borderRadius: 8 }}
              />
            </label>
          )}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {phase === "recording" ? (
              <button
                type="button"
                className="button primary small"
                onClick={() => void finish()}
              >
                Finish recording
              </button>
            ) : (
              <button
                type="button"
                className="button primary small"
                disabled={
                  disabled ||
                  !consent ||
                  !availability?.available ||
                  !["idle", "review"].includes(phase)
                }
                onClick={() => void start()}
              >
                Start recording
              </button>
            )}
            {phase === "review" && (
              <button
                type="button"
                className="button primary small"
                disabled={disabled || !consent || !transcript.trim()}
                onClick={() => void send()}
              >
                Send transcript
              </button>
            )}
            {!["idle", "review"].includes(phase) && (
              <button
                type="button"
                className="button secondary small"
                onClick={cancel}
              >
                Interrupt / stop
              </button>
            )}
            {!availability?.available && (
              <button
                type="button"
                className="button secondary small"
                onClick={() => void checkAvailability()}
              >
                Check availability
              </button>
            )}
          </div>
          <small>
            Voice never confirms a business action. Review and confirm any
            proposed change in the same workspace cards.
          </small>
        </section>
      )}
    </div>
  );
}

export default VoiceControl;
