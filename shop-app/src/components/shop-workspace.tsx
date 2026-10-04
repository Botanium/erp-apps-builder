"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Command, ShopState } from "@/lib/domain";
import {
  ContextCard,
  type CardSpec,
  type CommandDraft,
} from "./workspace-cards";
import { Icon, ShopIllustration } from "./icons";
import { VoiceControl } from "./voice/VoiceControl";

type Message = {
  id: string;
  role: "user" | "guide";
  text: string;
  cards?: CardSpec[];
  mode?: "local" | "live";
};
type Workspace = "preview" | "shop";
type PendingRequest = {
  text: string;
  paid: boolean;
  requestId: string;
  workspace: Workspace;
};
type Proposal = {
  draft: CommandDraft;
  title: string;
  details: string[];
  revision: number;
  idempotencyKey: string;
  workspace: Workspace;
};
const quickStarts = [
  {
    title: "Take a new order",
    detail: "From a message to a clear next step",
    icon: "bag" as const,
    prompt: "Help me record a new customer order",
    tone: "peach",
  },
  {
    title: "Get ready to restock",
    detail: "See what’s low and plan a purchase",
    icon: "box" as const,
    prompt: "Review low stock and help me create a supplier purchase",
    tone: "sage",
  },
  {
    title: "Check what needs me",
    detail: "Find the next useful thing to do",
    icon: "spark" as const,
    prompt: "What needs my attention in the shop today?",
    tone: "butter",
  },
];

const cardNames = new Set([
  "overview",
  "products",
  "order-intake",
  "order",
  "purchase",
  "money",
  "setup",
  "activity",
]);
function safeCards(input: unknown): CardSpec[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter(
      (card) => card && typeof card === "object" && cardNames.has(card.type)
    )
    .slice(0, 5)
    .map((card) => ({
      type: card.type,
      ...(typeof card.title === "string"
        ? { title: card.title.slice(0, 180) }
        : {}),
      ...(typeof card.entityId === "string"
        ? { entityId: card.entityId.slice(0, 100) }
        : {}),
    }));
}

function historyMessages(input: unknown): Message[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter(
      (message) =>
        message &&
        typeof message.id === "string" &&
        typeof message.text === "string" &&
        ["user", "assistant"].includes(message.role)
    )
    .map((message) => ({
      id: message.id,
      role: message.role === "user" ? "user" : "guide",
      text: message.text,
      cards: safeCards(message.cards),
      mode: message.mode === "live" ? "live" : "local",
    }));
}

async function jsonRequest(path: string, init?: RequestInit) {
  const response = await fetch(path, {
    cache: "no-store",
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw Object.assign(
      new Error(
        typeof data.error === "string"
          ? data.error
          : data.error?.message ||
              data.message ||
              `Request failed (${response.status}).`
      ),
      { status: response.status, code: data.code }
    );
  return data;
}

export function ShopWorkspace() {
  const [state, setState] = useState<ShopState | null>(null);
  const [phase, setPhase] = useState<"loading" | "entry" | "ready">("loading");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [notice, setNotice] = useState("");
  const [retryRequest, setRetryRequest] = useState<PendingRequest | null>(null);
  const [capabilities, setCapabilities] = useState<{
    liveAiEnabled: boolean;
    paidCallReservationMicroUsd?: number;
  }>({ liveAiEnabled: false });
  const [useAI, setUseAI] = useState(false);
  const [paidProposal, setPaidProposal] = useState<{
    text: string;
    requestId: string;
    workspace: Workspace;
  } | null>(null);
  const [ownerOpen, setOwnerOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const workingRef = useRef(false);
  const confirmingRef = useRef(false);
  const refreshSequenceRef = useRef(0);
  const scopeEpochRef = useRef(0);
  const scopeRef = useRef<string | null>(null);
  const paidDialogRef = useRef<HTMLDialogElement>(null);

  const resetScopedUI = useCallback(() => {
    scopeEpochRef.current += 1;
    setNotice("");
    setStatus("");
    setError("");
    setInput("");
    setProposal(null);
    setPaidProposal(null);
    setRetryRequest(null);
    setUseAI(false);
    setMenuOpen(false);
    setPassword("");
  }, []);

  const refresh = useCallback(
    async (expectedWorkspace?: Workspace) => {
      const sequence = ++refreshSequenceRef.current;
      try {
        const binding = expectedWorkspace
          ? { headers: { "X-Shop-Workspace": expectedWorkspace } }
          : undefined;
        const [result, conversation] = await Promise.all([
          jsonRequest("/api/state", binding),
          jsonRequest("/api/conversation", binding),
        ]);
        if (sequence !== refreshSequenceRef.current) return null;
        if (
          conversation.workspace !== result.state.mode ||
          (expectedWorkspace && result.state.mode !== expectedWorkspace)
        )
          throw Object.assign(
            new Error(
              "Workspace changed while loading. Please reload before continuing."
            ),
            { code: "WORKSPACE_CHANGED" }
          );
        if (scopeRef.current !== result.state.mode) {
          resetScopedUI();
          scopeRef.current = result.state.mode;
        }
        setMessages(historyMessages(conversation.messages));
        setCapabilities(result.capabilities);
        setState(result.state);
        setPhase("ready");
        return result.state as ShopState;
      } catch (err) {
        if (sequence !== refreshSequenceRef.current) return null;
        if ((err as { status?: number }).status === 401) {
          resetScopedUI();
          scopeRef.current = null;
          setMessages([]);
          setPhase("entry");
          setState(null);
          return null;
        }
        throw err;
      }
    },
    [resetScopedUI]
  );

  useEffect(() => {
    refresh().catch((err) => {
      setError(err.message);
      setPhase("entry");
    });
  }, [refresh]);
  useEffect(() => {
    if (paidProposal) paidDialogRef.current?.showModal();
    else paidDialogRef.current?.close();
  }, [paidProposal]);
  useEffect(() => {
    if (proposal) dialogRef.current?.showModal();
    else dialogRef.current?.close();
  }, [proposal]);

  async function enter(owner = false) {
    if (phase !== "entry" || busy) return;
    refreshSequenceRef.current += 1;
    setBusy(true);
    setError("");
    try {
      await jsonRequest("/api/session", {
        method: "POST",
        body: JSON.stringify(
          owner ? { mode: "shop", password } : { mode: "preview" }
        ),
      });
      resetScopedUI();
      scopeRef.current = null;
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function reloadConversation(
    expectedWorkspace: Workspace,
    epoch = scopeEpochRef.current
  ) {
    const conversation = await jsonRequest("/api/conversation", {
      headers: { "X-Shop-Workspace": expectedWorkspace },
    });
    if (epoch !== scopeEpochRef.current) return;
    if (
      conversation.workspace !== expectedWorkspace ||
      scopeRef.current !== expectedWorkspace
    )
      throw Object.assign(
        new Error("Workspace changed. Reload before continuing."),
        { code: "WORKSPACE_CHANGED" }
      );
    setMessages(historyMessages(conversation.messages));
  }

  async function clearStaleWorkspace() {
    resetScopedUI();
    scopeRef.current = null;
    setMessages([]);
    setState(null);
    setPhase("loading");
    try {
      await refresh();
      setError(
        "Your signed-in workspace changed. The stale action was cancelled, not retried. Review the current workspace before continuing."
      );
    } catch (err) {
      setError((err as Error).message);
      setPhase("entry");
    }
  }

  async function ask(
    text: string,
    signal?: AbortSignal,
    paid = false,
    requestId = crypto.randomUUID(),
    expectedWorkspace = state?.mode
  ): Promise<string | void> {
    if (!text.trim() || workingRef.current || !expectedWorkspace) return;
    if (scopeRef.current !== expectedWorkspace) {
      await clearStaleWorkspace();
      return;
    }
    workingRef.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    setInput("");
    setMenuOpen(false);
    setRetryRequest(null);
    const epoch = scopeEpochRef.current;
    const id = `${requestId}:assistant`;
    let answer = "";
    setMessages((current) => [
      ...current.filter(
        (message) => ![id, `${requestId}:user`].includes(message.id)
      ),
      { id: `${requestId}:user`, role: "user", text: text.trim() },
      { id, role: "guide", text: "", mode: paid ? "live" : "local" },
    ]);
    setStatus(
      paid
        ? "Preparing your approved AI request…"
        : "Reading your request with the local guide…"
    );
    setTimeout(
      () =>
        endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }),
      50
    );
    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shop-Workspace": expectedWorkspace,
        },
        signal,
        body: JSON.stringify({
          message: text.trim(),
          live: paid,
          requestId,
          ...(paid ? { approvePaidCall: true } : {}),
        }),
      });
      if (!response.ok || !response.body) {
        const result = await response.json().catch(() => ({}));
        throw Object.assign(
          new Error(
            typeof result.error === "string"
              ? result.error
              : result.error?.message ||
                  "The guide could not respond. Your records have not changed."
          ),
          { code: result.code, status: response.status }
        );
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finished = false;
      while (true) {
        const { done, value } = await reader.read();
        buffer += done
          ? decoder.decode()
          : decoder.decode(value, { stream: true });
        buffer = buffer.replace(/\r\n/g, "\n");
        let boundary: number;
        while ((boundary = buffer.indexOf("\n\n")) !== -1) {
          const chunk = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);
          const event = chunk
            .split("\n")
            .find((line) => line.startsWith("event:"))
            ?.slice(6)
            .trim();
          const raw = chunk
            .split("\n")
            .filter((line) => line.startsWith("data:"))
            .map((line) => line.slice(5).trim())
            .join("\n");
          if (!raw) continue;
          const data = JSON.parse(raw);
          if (epoch !== scopeEpochRef.current) {
            await reader.cancel();
            return;
          }
          if (scopeRef.current !== expectedWorkspace) {
            await reader.cancel();
            throw Object.assign(
              new Error("Workspace changed during the response."),
              { code: "WORKSPACE_CHANGED" }
            );
          }
          if (event === "text") {
            answer += data.text;
            setMessages((current) =>
              current.map((m) =>
                m.id === id ? { ...m, text: m.text + data.text } : m
              )
            );
          }
          if (event === "cards" && Array.isArray(data.cards))
            setMessages((current) =>
              current.map((m) =>
                m.id === id ? { ...m, cards: safeCards(data.cards) } : m
              )
            );
          if (event === "status")
            setStatus(
              `${paid ? "Live AI" : "Local guide"} · ${data.message || data.stage}`
            );
          if (event === "error")
            throw new Error(data.message || "Guide request failed.");
          if (event === "done") finished = true;
        }
        if (done) break;
      }
      if (!finished)
        throw new Error(
          "The response was interrupted. Your records have not changed; try again."
        );
      if (epoch !== scopeEpochRef.current) return;
      await reloadConversation(expectedWorkspace, epoch);
      return epoch === scopeEpochRef.current ? answer : undefined;
    } catch (err) {
      if (epoch !== scopeEpochRef.current) return;
      if (
        (err as { code?: string }).code === "WORKSPACE_CHANGED" ||
        (err as { status?: number }).status === 401
      )
        await clearStaleWorkspace();
      else {
        setError((err as Error).message);
        if (!signal?.aborted)
          setRetryRequest({
            text: text.trim(),
            paid,
            requestId,
            workspace: expectedWorkspace,
          });
        await reloadConversation(expectedWorkspace, epoch).catch(
          async (error) => {
            if (error.code === "WORKSPACE_CHANGED") await clearStaleWorkspace();
          }
        );
      }
    } finally {
      workingRef.current = false;
      setBusy(false);
      setStatus("");
      inputRef.current?.focus();
    }
  }

  function propose(draft: CommandDraft, title: string, details: string[]) {
    if (!state) return;
    setError("");
    setProposal({
      draft,
      title,
      details,
      revision: state.revision,
      idempotencyKey: crypto.randomUUID(),
      workspace: state.mode,
    });
  }

  async function confirm() {
    if (!proposal || busy || confirmingRef.current) return;
    if (scopeRef.current !== proposal.workspace) {
      await clearStaleWorkspace();
      return;
    }
    confirmingRef.current = true;
    const epoch = scopeEpochRef.current;
    setBusy(true);
    setError("");
    const command = {
      ...proposal.draft,
      expectedRevision: proposal.revision,
      idempotencyKey: proposal.idempotencyKey,
    } as Command;
    try {
      const result = await jsonRequest("/api/commands", {
        method: "POST",
        headers: { "X-Shop-Workspace": proposal.workspace },
        body: JSON.stringify(command),
      });
      if (epoch !== scopeEpochRef.current) return;
      if (
        result.state.mode !== proposal.workspace ||
        scopeRef.current !== proposal.workspace
      )
        throw Object.assign(new Error("Workspace changed while saving."), {
          code: "WORKSPACE_CHANGED",
        });
      setState(result.state);
      const verified = await refresh(proposal.workspace);
      if (epoch !== scopeEpochRef.current) return;
      if (
        !verified ||
        verified.revision < result.state.revision ||
        !verified.processedCommands[proposal.idempotencyKey]
      )
        throw new Error(
          "The action was saved, but the follow-up read could not verify it. Reload before trying again."
        );
      setProposal(null);
      setNotice(
        `${proposal.title} — saved and read back from workspace records (revision ${verified.revision}).`
      );
    } catch (err) {
      if (epoch !== scopeEpochRef.current) return;
      if (
        (err as { code?: string }).code === "WORKSPACE_CHANGED" ||
        (err as { status?: number }).status === 401
      )
        await clearStaleWorkspace();
      else {
        setError((err as Error).message);
        await refresh(proposal.workspace).catch(async (error) => {
          if (error.code === "WORKSPACE_CHANGED") await clearStaleWorkspace();
        });
      }
    } finally {
      confirmingRef.current = false;
      setBusy(false);
    }
  }

  function sendComposer() {
    if (!input.trim() || busy) return;
    if (useAI && capabilities.liveAiEnabled && state?.mode === "shop")
      setPaidProposal({
        text: input.trim(),
        requestId: crypto.randomUUID(),
        workspace: state.mode,
      });
    else void ask(input);
  }

  const activeCardMessageId = messages
    .slice()
    .reverse()
    .find((message) => message.cards?.length)?.id;
  const pending =
    state?.orders.filter(
      (order) => !["delivered", "cancelled", "returned"].includes(order.status)
    ) || [];
  const lowStock =
    state?.products.filter(
      (product) => product.stock - product.reserved <= product.lowStockAt
    ) || [];

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Little Shop home">
          <span className="brand-mark">
            <Icon name="leaf" size={23} />
          </span>
          <span>
            little shop
            <span className="brand-subtitle">
              A space to make things happen
            </span>
          </span>
        </a>
        <div className="topbar-right">
          <span className="preview-tag">
            <span /> {state?.mode === "shop" ? "Own shop" : "Synthetic preview"}
          </span>
          <button
            className="icon-button"
            disabled={phase === "loading"}
            aria-label="Workspace options"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <Icon name="settings" />
          </button>
          <span className="avatar" aria-label="Workspace owner">
            B
          </span>
        </div>
        {menuOpen ? (
          <div className="workspace-menu">
            <button
              onClick={() => {
                setOwnerOpen(true);
                setMenuOpen(false);
                setNotice(
                  state?.mode === "shop"
                    ? "You are in the separate owner shop. Preview records are never copied here. Connections and production acceptance remain separate."
                    : "Sign out, then choose Own-business access. A configured owner password opens a separate empty shop; preview data is never copied."
                );
              }}
            >
              About own-business mode
            </button>
            <button
              disabled={busy || !state}
              onClick={() => ask("Show the setup and connection status")}
            >
              Connections & AI status
            </button>
            <button
              disabled={busy || !state}
              onClick={() => ask("Show the recent activity audit trail")}
            >
              Activity trail
            </button>
            <button
              disabled={busy}
              onClick={async () => {
                await jsonRequest("/api/session", { method: "DELETE" });
                refreshSequenceRef.current += 1;
                resetScopedUI();
                scopeRef.current = null;
                setMessages([]);
                setState(null);
                setPhase("entry");
                setMenuOpen(false);
              }}
            >
              End local session
            </button>
          </div>
        ) : null}
      </header>

      {phase !== "ready" ? (
        <main className="entry-page">
          <div className="entry-copy">
            <span className="eyebrow">YOUR SHOP, A LITTLE MORE TOGETHER</span>
            <h1>
              Big dreams.
              <br />
              <em>Little shop.</em>
            </h1>
            <p>
              Orders, colorful things, and your next good idea.
              <br />
              Bring them together in one thoughtful working space.
            </p>
            <div className="entry-actions">
              <button
                className="button primary"
                disabled={busy || phase === "loading"}
                onClick={() => enter()}
              >
                {phase === "loading"
                  ? "Opening workspace…"
                  : busy
                    ? "Starting preview…"
                    : "Explore the local preview"}
                <Icon name="arrow" size={18} />
              </button>
              <button
                className="text-button"
                disabled={busy || phase === "loading"}
                onClick={() => setOwnerOpen(!ownerOpen)}
              >
                Own-business access
              </button>
            </div>
            <p className="fine-print">
              Sample toys & stationery only. No connected accounts, real
              payments, or paid AI calls.
            </p>
            {ownerOpen ? (
              <form
                className="owner-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  void enter(true);
                }}
              >
                <p>
                  A configured owner password opens your separate shop. It
                  starts empty, with no preview records. You’ll enter the
                  business name and currency yourself.
                </p>
                <label>
                  Owner password
                  <input
                    type="password"
                    disabled={busy || phase !== "entry"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </label>
                <button
                  className="button secondary"
                  disabled={busy || phase !== "entry"}
                >
                  Sign in
                </button>
              </form>
            ) : null}
            {error ? (
              <p role="alert" className="error-box">
                {error}
              </p>
            ) : null}
          </div>
          <div className="entry-art">
            <ShopIllustration />
            <span className="art-caption">
              Small things. Beautiful possibilities.
            </span>
          </div>
        </main>
      ) : (
        <>
          <div className="workspace-breadcrumb">
            <span className="status-dot" /> YOUR WORKSPACE{" "}
            <span className="breadcrumb-slash">/</span>
            <span>Let’s make progress</span>
            <span className="saved-label">
              Workspace records · revision {state?.revision}
            </span>
          </div>
          <main className="workspace-grid">
            <section
              className="conversation"
              aria-label="Shop conversation and working cards"
            >
              {messages.length === 0 ? (
                <div className="welcome">
                  <div>
                    <span className="eyebrow">A FRESH LITTLE START</span>
                    <h1>
                      What’s on your
                      <br />
                      <em>shop mind?</em>
                    </h1>
                    <p>
                      Let’s turn your next “I need to…” into something done.
                      <br className="desktop-break" /> I’ll help you work
                      through it, one clear step at a time.
                    </p>
                  </div>
                  <ShopIllustration />
                </div>
              ) : (
                <div className="conversation-heading">
                  <div>
                    <span className="eyebrow">YOUR WORKING SPACE</span>
                    <h1>Let’s work on it.</h1>
                  </div>
                  <button
                    className="text-button"
                    disabled={busy}
                    onClick={() => {
                      setInput("");
                      inputRef.current?.focus();
                      inputRef.current?.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      });
                    }}
                  >
                    New task <Icon name="plus" size={15} />
                  </button>
                </div>
              )}

              {messages.length === 0 ? (
                <div className="quick-starts">
                  {quickStarts.map((item) => (
                    <button
                      key={item.title}
                      className={`quick-start ${item.tone}`}
                      disabled={busy}
                      onClick={() => ask(item.prompt)}
                    >
                      <span className="quick-icon">
                        <Icon name={item.icon} size={23} />
                      </span>
                      <strong>{item.title}</strong>
                      <span>{item.detail}</span>
                      <Icon name="arrow" size={18} />
                    </button>
                  ))}
                </div>
              ) : null}

              {state?.setup.status === "unconfigured" &&
              messages.length === 0 ? (
                <ContextCard
                  card={{ type: "setup" }}
                  state={state}
                  busy={busy}
                  onPropose={propose}
                  onAsk={ask}
                />
              ) : null}
              <div className="message-list">
                {messages.map((message) => (
                  <article
                    className={`message ${message.role}`}
                    key={message.id}
                  >
                    <div className="message-avatar">
                      {message.role === "guide" ? (
                        <Icon name="spark" size={18} />
                      ) : (
                        "B"
                      )}
                    </div>
                    <div className="message-content">
                      <span className="message-author">
                        {message.role === "guide" ? "Shop guide" : "You"}
                        {message.role === "guide" ? (
                          <span className="guide-label">
                            {message.mode === "live"
                              ? "LIVE AI"
                              : "LOCAL GUIDE"}
                          </span>
                        ) : null}
                      </span>
                      {message.text ? (
                        <p className="message-text">{message.text}</p>
                      ) : busy ? (
                        <p className="response-pending">
                          Preparing your workspace…
                        </p>
                      ) : (
                        <p className="muted">
                          No response received. You can try again.
                        </p>
                      )}
                      {message.id === activeCardMessageId ? (
                        (Array.isArray(message.cards) ? message.cards : []).map(
                          (card, index) =>
                            state ? (
                              <ContextCard
                                key={`${card.type}-${index}`}
                                card={card}
                                state={state}
                                busy={busy}
                                onPropose={propose}
                                onAsk={ask}
                              />
                            ) : null
                        )
                      ) : message.cards?.length ? (
                        <div className="previous-context">
                          <Icon name="check" size={13} />
                          <span>
                            Previous working context ·{" "}
                            {message.cards
                              .map((card) => card.type.replace("-", " "))
                              .join(", ")}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>

              {notice ? (
                <div className="success-box" role="status">
                  <Icon name="check" size={18} />
                  <span>{notice}</span>
                  <button
                    className="icon-button"
                    aria-label="Dismiss notification"
                    onClick={() => setNotice("")}
                  >
                    <Icon name="close" size={16} />
                  </button>
                </div>
              ) : null}
              {error ? (
                <div className="error-box" role="alert">
                  <strong>We couldn’t finish that.</strong>
                  <p>{error}</p>
                  {retryRequest ? (
                    <button
                      className="button secondary small"
                      disabled={busy}
                      onClick={() =>
                        void ask(
                          retryRequest.text,
                          undefined,
                          retryRequest.paid,
                          retryRequest.requestId,
                          retryRequest.workspace
                        )
                      }
                    >
                      Retry same request
                    </button>
                  ) : null}
                  <button
                    className="text-button"
                    onClick={() => {
                      setError("");
                      refresh().catch((err) => setError(err.message));
                    }}
                  >
                    Reload current records
                  </button>
                </div>
              ) : null}
              <div ref={endRef} />
              <div className="composer-wrap">
                <form
                  className={`composer ${busy ? "is-busy" : ""}`}
                  onSubmit={(event) => {
                    event.preventDefault();
                    sendComposer();
                  }}
                >
                  <label className="sr-only" htmlFor="shop-intent">
                    What would you like to do?
                  </label>
                  <textarea
                    id="shop-intent"
                    ref={inputRef}
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder="I need to…"
                    rows={2}
                    maxLength={2000}
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter" &&
                        !event.shiftKey &&
                        !event.nativeEvent.isComposing
                      ) {
                        event.preventDefault();
                        sendComposer();
                      }
                    }}
                  />
                  <div className="composer-toolbar">
                    <div className="composer-tools">
                      <span className="guide-mode">
                        <span />{" "}
                        {useAI ? "AI · approval required" : "Local guide"}
                      </span>
                    </div>
                    <button
                      className="send-button"
                      disabled={busy || !input.trim()}
                      aria-label="Send message"
                    >
                      <Icon name="arrow" size={21} />
                    </button>
                  </div>
                </form>
                {busy ? (
                  <p className="composer-caption" role="status">
                    <span className="working-dot" />
                    {status || "Saving your confirmed action…"}
                  </p>
                ) : (
                  <p className="composer-caption">
                    You stay in control. Changes are reviewed before they’re
                    saved.
                    <span>Enter to send · Shift + Enter for a new line</span>
                  </p>
                )}
                <div className="conversation-controls">
                  {state ? (
                    <VoiceControl
                      key={state.mode}
                      workspace={state.mode}
                      disabled={busy}
                      onIntent={ask}
                      onWorkspaceChanged={() => void clearStaleWorkspace()}
                    />
                  ) : null}
                  <label className="ai-toggle">
                    <input
                      type="checkbox"
                      checked={useAI}
                      onChange={(event) => setUseAI(event.target.checked)}
                      disabled={
                        !capabilities.liveAiEnabled ||
                        state?.mode !== "shop" ||
                        busy
                      }
                    />{" "}
                    Use AI for next text reply
                  </label>
                  <span className="field-help">
                    {capabilities.liveAiEnabled && state?.mode === "shop"
                      ? "Each paid text reply needs confirmation. Voice uses the local guide."
                      : "AI spending is disabled. Voice and AI require separately approved server budgets."}
                  </span>
                </div>
              </div>
              {messages.length === 0 ? (
                <div className="workspace-note">
                  <Icon name="leaf" size={17} />
                  <p>
                    A calm place for the busy bits.
                    <br />
                    <span>
                      Try an order, plan a purchase, or just ask where to start.
                    </span>
                  </p>
                </div>
              ) : null}
            </section>

            <aside className="context-rail" aria-label="Workspace context">
              <div className="rail-note">
                <span className="eyebrow">A LITTLE CONTEXT</span>
                <h2>
                  Your shop,
                  <br />
                  at a glance.
                </h2>
                <p>
                  {state?.synthetic ? (
                    <>
                      Sample records to explore.
                      <br />
                      Nothing here is your real business.
                    </>
                  ) : (
                    <>
                      {state?.setup.businessName || "Your empty shop"}
                      <br />
                      Owner-entered records ·{" "}
                      {state?.currency || "currency not configured"}
                    </>
                  )}
                </p>
              </div>
              <div className="attention-card">
                <div className="attention-heading">
                  <span className="tiny-icon">
                    <Icon name="clock" size={17} />
                  </span>
                  <span>Worth a look</span>
                </div>
                <button
                  disabled={busy}
                  onClick={() =>
                    ask("Show my orders and the next step for each")
                  }
                >
                  <span>
                    <strong>{pending.length} orders</strong>
                    <span>have a next step</span>
                  </span>
                  <Icon name="chevron" size={16} />
                </button>
                <button
                  disabled={busy}
                  onClick={() => ask("Which products need restocking?")}
                >
                  <span>
                    <strong>{lowStock.length} products</strong>
                    <span>at their low-stock threshold</span>
                  </span>
                  <Icon name="chevron" size={16} />
                </button>
              </div>
              <div className="rail-links">
                <span className="eyebrow">PICK UP A THREAD</span>
                <button
                  disabled={busy}
                  onClick={() =>
                    ask("Show the product catalog and help me add a product")
                  }
                >
                  <Icon name="box" size={17} /> Products & stock{" "}
                  <Icon name="arrow" size={15} />
                </button>
                <button
                  disabled={busy}
                  onClick={() => ask("Review COD and online payment records")}
                >
                  <Icon name="bag" size={17} /> Payment records{" "}
                  <Icon name="arrow" size={15} />
                </button>
                <button
                  disabled={busy}
                  onClick={() => ask("Show the recent activity audit trail")}
                >
                  <Icon name="history" size={17} /> Recent activity{" "}
                  <Icon name="arrow" size={15} />
                </button>
              </div>
              <div className="honesty-note">
                <span className="status-dot" />
                <strong>
                  {state?.synthetic
                    ? "A safe space to try"
                    : "Your records, your control"}
                </strong>
                <p>
                  Instagram, WhatsApp, and Website are manual order labels.
                  Payment entries are records, not money movement.
                </p>
                <button
                  className="text-button"
                  disabled={busy}
                  onClick={() => ask("Show setup and what is not connected")}
                >
                  What’s connected? <Icon name="arrow" size={14} />
                </button>
              </div>
            </aside>
          </main>
          <footer className="app-footer">
            <span>Made for the business you’re building.</span>
            <span>
              {state?.synthetic ? "SYNTHETIC DATA" : "OWNER WORKSPACE"} · NO
              LIVE INTEGRATIONS
            </span>
          </footer>
        </>
      )}

      <dialog
        ref={paidDialogRef}
        className="confirmation-dialog"
        onCancel={() => setPaidProposal(null)}
        aria-labelledby="paid-title"
      >
        {paidProposal ? (
          <>
            <span className="eyebrow">PAID PROVIDER REQUEST</span>
            <h2 id="paid-title">Use AI for this reply?</h2>
            <p className="confirmation-scope">
              Your message and a limited workspace summary will be sent to
              OpenAI. This reserves up to{" "}
              {(
                (capabilities.paidCallReservationMicroUsd || 30000) / 1000000
              ).toFixed(2)}{" "}
              USD from the server’s approved budget. An interrupted request may
              still be charged. The model cannot save business changes.
            </p>
            <p className="message-text">{paidProposal.text}</p>
            <div className="dialog-actions">
              <button
                className="button secondary"
                onClick={() => setPaidProposal(null)}
              >
                Keep editing
              </button>
              <button
                className="button primary"
                onClick={() => {
                  const approved = paidProposal;
                  setPaidProposal(null);
                  setUseAI(false);
                  void ask(
                    approved.text,
                    undefined,
                    true,
                    approved.requestId,
                    approved.workspace
                  );
                }}
              >
                Approve this paid reply
              </button>
            </div>
          </>
        ) : null}
      </dialog>
      <dialog
        ref={dialogRef}
        className="confirmation-dialog"
        onCancel={(event) => {
          if (busy) event.preventDefault();
          else setProposal(null);
        }}
        aria-labelledby="confirm-title"
      >
        {proposal ? (
          <>
            <div className="dialog-topline">
              <span className="eyebrow">REVIEW BEFORE SAVING</span>
              <button
                className="icon-button"
                disabled={busy}
                aria-label="Close review"
                onClick={() => setProposal(null)}
              >
                <Icon name="close" />
              </button>
            </div>
            <span className="confirmation-icon">
              <Icon name="check" size={27} />
            </span>
            <h2 id="confirm-title">{proposal.title}</h2>
            <ul>
              {proposal.details.map((detail, index) => (
                <li key={index}>{detail}</li>
              ))}
            </ul>
            <p className="confirmation-scope">
              This changes only{" "}
              {state?.synthetic
                ? "the synthetic preview"
                : "your owner shop records"}
              . It does not send messages, order from a supplier, move money, or
              update a connected account.
            </p>
            <div className="review-steps">
              <span className="complete">1 · Proposed</span>
              <span className="active">2 · Your confirmation</span>
              <span>3 · Save & verify</span>
            </div>
            {error ? (
              <p className="error-box" role="alert">
                {error}
              </p>
            ) : null}
            <div className="dialog-actions">
              <button
                className="button secondary"
                disabled={busy}
                onClick={() => setProposal(null)}
              >
                Back to editing
              </button>
              <button
                className="button primary"
                disabled={busy}
                onClick={confirm}
              >
                {busy ? "Saving & verifying…" : "Confirm & save"}
                <Icon name="arrow" size={17} />
              </button>
            </div>
          </>
        ) : null}
      </dialog>
    </div>
  );
}
