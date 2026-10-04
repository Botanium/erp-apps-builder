import { assertLiveEnabled, parseAgentInput, runAgent } from "@/lib/agent";
import type { AgentCard, AgentEvent } from "@/lib/agent";
import {
  errorResponse,
  HttpError,
  readJson,
  requireSameOrigin,
  requireSession,
  requireWorkspace,
} from "@/lib/auth";
import {
  beginConversation,
  finishConversation,
  readConversation,
  readState,
} from "@/lib/store";
import { CONVERSATION_ASSISTANT_LIMIT } from "@/lib/conversation";
export const runtime = "nodejs";
export const maxDuration = 40;
export async function POST(request: Request) {
  try {
    const session = await requireSession(request);
    requireSameOrigin(request);
    requireWorkspace(request, session);
    const input = parseAgentInput(await readJson(request, 10_000));
    if (!input.requestId)
      throw new HttpError(
        400,
        "A stable requestId is required for conversation persistence. Reuse it when retrying the same request.",
        "REQUEST_ID_REQUIRED"
      );
    if (input.requestId.startsWith("command-"))
      throw new HttpError(
        400,
        "This request ID namespace is reserved for server-generated command confirmations.",
        "REQUEST_ID_RESERVED"
      );
    if (
      input.live &&
      (session.mode !== "owner" || session.workspace !== "shop")
    )
      throw new HttpError(
        403,
        "Paid AI requires an authenticated owner shop session. Preview never spends owner credits.",
        "OWNER_REQUIRED"
      );
    assertLiveEnabled(input);
    const state = await readState(session.workspace);
    const mode = input.live ? "live" : "local-guide";
    let disposition: "created" | "completed" | "pending";
    try {
      disposition = await beginConversation(
        input.requestId,
        input.message,
        mode,
        session.workspace
      );
    } catch {
      throw new HttpError(
        409,
        "Conversation request could not be started. Its ID may already belong to different content, or conversation storage is unavailable.",
        "CONVERSATION_CONFLICT"
      );
    }
    if (disposition === "pending")
      throw new HttpError(
        409,
        "This request is already in progress or was interrupted. Read the saved conversation before starting a new request; it will not be sent again automatically.",
        "CONVERSATION_PENDING"
      );
    const encoder = new TextEncoder();
    const headers = {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-store, no-transform",
      "X-Content-Type-Options": "nosniff",
      "X-Accel-Buffering": "no",
    };
    if (disposition === "completed") {
      const saved = (await readConversation(session.workspace)).find(
        (message) =>
          message.requestId === input.requestId && message.role === "assistant"
      );
      if (!saved)
        throw new HttpError(
          410,
          "This request was already handled but its visible history has expired. It will not be executed again.",
          "CONVERSATION_EXPIRED"
        );
      const events = [
        { event: "text", data: { text: saved.text } },
        ...(saved.cards
          ? [{ event: "cards", data: { cards: saved.cards } }]
          : []),
        {
          event: "done",
          data: {
            mode: saved.mode,
            runId: input.requestId,
            replayed: true,
            messageId: saved.id,
          },
        },
      ];
      return new Response(
        events
          .map(
            (event) =>
              `event: ${event.event}\ndata: ${JSON.stringify(event.data)}\n\n`
          )
          .join(""),
        { headers }
      );
    }
    const requestId = input.requestId;
    const abort = new AbortController();
    const signal = AbortSignal.any([request.signal, abort.signal]);
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (event: string, data: unknown) => {
          if (!signal.aborted)
            controller.enqueue(
              encoder.encode(
                `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
              )
            );
        };
        let text = "";
        let cards: AgentCard[] | undefined;
        let done: AgentEvent | undefined;
        let failure: { message: string; code: string } | undefined;
        try {
          for await (const event of runAgent(input, state, signal)) {
            if (event.event === "text")
              text = (text + event.data.text).slice(
                0,
                CONVERSATION_ASSISTANT_LIMIT
              );
            if (event.event === "cards") cards = event.data.cards;
            if (event.event === "done") done = event;
            else send(event.event, event.data);
          }
          if (!done)
            failure = {
              message:
                "Request was interrupted. No business changes were made by the agent; a paid request may still have consumed its reservation.",
              code: "AGENT_CANCELLED",
            };
        } catch (error) {
          failure = {
            message:
              error instanceof HttpError
                ? error.message
                : "Agent request failed or was cancelled. Nothing was changed.",
            code: error instanceof HttpError ? error.code : "AGENT_ERROR",
          };
        }
        try {
          const savedText = failure
            ? `${text.slice(0, 10000)}${text ? "\n\n" : ""}${failure.message}`
            : text ||
              "Guidance is ready. Review the selected workflow cards; no business changes were made.";
          await finishConversation(
            requestId,
            {
              id: `${requestId}:assistant`,
              requestId,
              role: "assistant",
              text: savedText,
              mode,
              ...(cards ? { cards } : {}),
              createdAt: new Date().toISOString(),
            },
            session.workspace
          );
          if (failure) send("error", failure);
          else if (done?.event === "done")
            send("done", {
              ...done.data,
              requestId,
              messageId: `${requestId}:assistant`,
            });
        } catch {
          send("error", {
            message:
              "The response could not be saved durably. Do not retry with a new request ID until you inspect the conversation; any paid reservation remains consumed.",
            code: "CONVERSATION_SAVE_FAILED",
          });
        } finally {
          if (!signal.aborted) controller.close();
        }
      },
      cancel() {
        abort.abort();
      },
    });
    return new Response(stream, { headers });
  } catch (error) {
    return errorResponse(error);
  }
}
