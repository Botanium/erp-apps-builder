import type { AgentCard } from "./agent";
import type { Command, ShopState } from "./domain";
import { createHash } from "node:crypto";

/** Server-attributed history. Clients may submit a user request, never arbitrary history records. */
export type ConversationMessage = {
  id: string;
  requestId: string;
  role: "user" | "assistant";
  text: string;
  mode: "local-guide" | "live" | "system";
  cards?: AgentCard[];
  createdAt: string;
};
export const CONVERSATION_USER_LIMIT = 2000;
export const CONVERSATION_ASSISTANT_LIMIT = 12000;
export const CONVERSATION_VISIBLE_TURNS = 50;

export function buildCommandConfirmation(
  command: Command,
  state: ShopState
): ConversationMessage {
  const audit = state.audit.find(
    (event) => event.idempotencyKey === command.idempotencyKey
  );
  if (!audit)
    throw new Error(
      "Committed command audit is required for a conversation confirmation"
    );
  let card: AgentCard;
  if (command.type.startsWith("order."))
    card = { type: "order", entityId: audit.entityId };
  else if (command.type.startsWith("payment.")) card = { type: "money" };
  else if (command.type.startsWith("purchase."))
    card = { type: "purchase", entityId: audit.entityId };
  else if (command.type.startsWith("supplier.")) card = { type: "purchase" };
  else if (
    command.type.startsWith("product.") ||
    command.type === "stock.adjust"
  )
    card = { type: "products" };
  else card = { type: "setup" };
  const requestId = `command-${createHash("sha256").update(command.idempotencyKey).digest("hex")}`;
  return {
    id: `${requestId}:assistant`,
    requestId,
    role: "assistant",
    mode: "system",
    text: `Saved ${command.type} for ${audit.entityId} at workspace revision ${audit.revision}. ${state.synthetic ? "Synthetic preview only." : "Owner-recorded shop data."} This records your confirmed action; it does not independently verify any external event.`,
    cards: [card],
    createdAt: new Date().toISOString(),
  };
}
