import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createHash } from "node:crypto";
import {
  applyCommand,
  emptyState,
  initialState,
  normalizeState,
  type Command,
  type ShopState,
} from "./domain";
import {
  buildCommandConfirmation,
  type ConversationMessage,
} from "./conversation";
export type WorkspaceMode = "preview" | "shop";

/** Single-shop persistence. Domain validation and write commit share one transaction. */
export interface ShopStore {
  read(): Promise<ShopState>;
  execute(command: Command, actor: string): Promise<ShopState>;
  reserveBudget(
    runId: string,
    reservedMicroUsd: number,
    maxMicroUsd: number
  ): Promise<void>;
  beginConversation(
    requestId: string,
    userText: string,
    mode: "local-guide" | "live"
  ): Promise<"created" | "completed" | "pending">;
  finishConversation(
    requestId: string,
    message: ConversationMessage
  ): Promise<void>;
  readConversation(): Promise<ConversationMessage[]>;
  clearConversation(): Promise<void>;
  close(): Promise<void>;
}

export async function createSqliteStore(
  filename: string,
  seed: () => ShopState = initialState
): Promise<ShopStore> {
  const { DatabaseSync } = await import("node:sqlite");
  if (filename !== ":memory:")
    mkdirSync(dirname(filename), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(filename);
  db.exec("PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;");
  db.exec(
    "CREATE TABLE IF NOT EXISTS shop_state (id INTEGER PRIMARY KEY CHECK (id = 1), document TEXT NOT NULL)"
  );
  db.exec(
    "CREATE TABLE IF NOT EXISTS ai_budget (run_id TEXT PRIMARY KEY, reserved_micro_usd INTEGER NOT NULL CHECK (reserved_micro_usd > 0))"
  );
  db.exec(
    "CREATE TABLE IF NOT EXISTS conversation_turns (seq INTEGER PRIMARY KEY AUTOINCREMENT, run_id TEXT UNIQUE NOT NULL, fingerprint TEXT NOT NULL, user_text TEXT, mode TEXT NOT NULL, created_at TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', assistant TEXT)"
  );
  db.prepare(
    "INSERT OR IGNORE INTO shop_state (id, document) VALUES (1, ?)"
  ).run(JSON.stringify(seed()));
  const read = (): ShopState => {
    const row = db
      .prepare("SELECT document FROM shop_state WHERE id = 1")
      .get() as { document: string };
    return normalizeState(JSON.parse(row.document));
  };
  return {
    async read() {
      return read();
    },
    async execute(command, actor) {
      db.exec("BEGIN IMMEDIATE");
      try {
        const previous = read();
        const state = applyCommand(
          previous,
          command,
          actor,
          new Date().toISOString()
        );
        if (state.revision !== previous.revision) {
          db.prepare("UPDATE shop_state SET document = ? WHERE id = 1").run(
            JSON.stringify(state)
          );
          const confirmation = buildCommandConfirmation(command, state);
          db.prepare(
            "INSERT INTO conversation_turns (run_id,fingerprint,user_text,mode,created_at,status,assistant) VALUES (?,?,'','local-guide',?,'completed',?)"
          ).run(
            confirmation.requestId,
            createHash("sha256").update(JSON.stringify(command)).digest("hex"),
            confirmation.createdAt,
            JSON.stringify(confirmation)
          );
          db.exec(
            "UPDATE conversation_turns SET user_text=NULL,assistant=NULL WHERE seq NOT IN (SELECT seq FROM conversation_turns ORDER BY seq DESC LIMIT 50)"
          );
        }
        db.exec("COMMIT");
        return state;
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    },
    async reserveBudget(runId, reservedMicroUsd, maxMicroUsd) {
      validateBudget(runId, reservedMicroUsd, maxMicroUsd);
      db.exec("BEGIN IMMEDIATE");
      try {
        const existing = db
          .prepare("SELECT 1 FROM ai_budget WHERE run_id = ?")
          .get(runId);
        if (existing)
          throw new Error(
            "AI request already reserved; retries require a new explicit request"
          );
        const { used } = db
          .prepare(
            "SELECT COALESCE(SUM(reserved_micro_usd), 0) AS used FROM ai_budget"
          )
          .get() as { used: number };
        if (used + reservedMicroUsd > maxMicroUsd)
          throw new Error("AI budget exhausted or not authorized");
        db.prepare(
          "INSERT INTO ai_budget (run_id, reserved_micro_usd) VALUES (?, ?)"
        ).run(runId, reservedMicroUsd);
        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    },
    async beginConversation(requestId, userText, mode) {
      const fingerprint = conversationFingerprint(requestId, userText, mode);
      db.exec("BEGIN IMMEDIATE");
      try {
        const existing = db
          .prepare(
            "SELECT fingerprint,status FROM conversation_turns WHERE run_id=?"
          )
          .get(requestId) as
          { fingerprint: string; status: "completed" | "pending" } | undefined;
        if (existing) {
          if (existing.fingerprint !== fingerprint)
            throw new Error(
              "Conversation request ID reused with different input"
            );
          db.exec("COMMIT");
          return existing.status;
        }
        db.prepare(
          "INSERT INTO conversation_turns (run_id,fingerprint,user_text,mode,created_at) VALUES (?,?,?,?,?)"
        ).run(requestId, fingerprint, userText, mode, new Date().toISOString());
        db.exec(
          "UPDATE conversation_turns SET user_text=NULL,assistant=NULL WHERE seq NOT IN (SELECT seq FROM conversation_turns ORDER BY seq DESC LIMIT 50)"
        );
        db.exec("COMMIT");
        return "created";
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    },
    async finishConversation(requestId, message) {
      const safe = assistantMessage(requestId, message);
      const result = db
        .prepare(
          "UPDATE conversation_turns SET assistant=CASE WHEN user_text IS NULL THEN NULL ELSE ? END,status='completed' WHERE run_id=? AND status='pending'"
        )
        .run(JSON.stringify(safe), requestId);
      if (result.changes !== 1)
        throw new Error("Conversation request is missing or already completed");
    },
    async readConversation() {
      const rows = db
        .prepare(
          "SELECT run_id,user_text,mode,created_at,assistant FROM conversation_turns WHERE user_text IS NOT NULL ORDER BY seq"
        )
        .all() as ConversationRow[];
      return conversationMessages(rows);
    },
    async clearConversation() {
      db.exec("UPDATE conversation_turns SET user_text=NULL,assistant=NULL");
    },
    async close() {
      db.close();
    },
  };
}

/** Schema/bootstrap is an explicit deployment gate, never an automatic hosted write. */
export async function createPostgresStore(
  connectionString: string
): Promise<ShopStore> {
  const { Pool } = await import("pg");
  const pool = new Pool({
    connectionString,
    max: 3,
    connectionTimeoutMillis: 5000,
  });
  // This runs only after an explicitly provisioned schema exists. The sole seed is an empty shop.
  try {
    await pool.query(
      "INSERT INTO shop_state (id, document) VALUES ($1, $2::jsonb) ON CONFLICT (id) DO NOTHING",
      ["primary", JSON.stringify(emptyState())]
    );
  } catch (error) {
    await pool.end();
    throw error;
  }
  return {
    async read() {
      const result = await pool.query(
        "SELECT document FROM shop_state WHERE id = $1",
        ["primary"]
      );
      if (!result.rows[0])
        throw new Error("MISSING: production shop initialization");
      return normalizeState(result.rows[0].document);
    },
    async execute(command, actor) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const result = await client.query(
          "SELECT document FROM shop_state WHERE id = $1 FOR UPDATE",
          ["primary"]
        );
        if (!result.rows[0])
          throw new Error("MISSING: production shop initialization");
        const previous = normalizeState(result.rows[0].document);
        const state = applyCommand(
          previous,
          command,
          actor,
          new Date().toISOString()
        );
        if (state.revision !== previous.revision) {
          await client.query(
            "UPDATE shop_state SET document = $1::jsonb WHERE id = $2",
            [JSON.stringify(state), "primary"]
          );
          const confirmation = buildCommandConfirmation(command, state);
          await client.query(
            "INSERT INTO conversation_turns (run_id,fingerprint,user_text,mode,created_at,status,assistant) VALUES ($1,$2,'','local-guide',$3,'completed',$4::jsonb)",
            [
              confirmation.requestId,
              createHash("sha256")
                .update(JSON.stringify(command))
                .digest("hex"),
              confirmation.createdAt,
              JSON.stringify(confirmation),
            ]
          );
          await client.query(
            "UPDATE conversation_turns SET user_text=NULL,assistant=NULL WHERE seq NOT IN (SELECT seq FROM conversation_turns ORDER BY seq DESC LIMIT 50)"
          );
        }
        await client.query("COMMIT");
        return state;
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },
    async reserveBudget(runId, reservedMicroUsd, maxMicroUsd) {
      validateBudget(runId, reservedMicroUsd, maxMicroUsd);
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query("LOCK TABLE ai_budget IN EXCLUSIVE MODE");
        const used = await client.query(
          "SELECT COALESCE(SUM(reserved_micro_usd), 0) AS used FROM ai_budget"
        );
        if (Number(used.rows[0].used) + reservedMicroUsd > maxMicroUsd)
          throw new Error("AI budget exhausted or not authorized");
        await client.query(
          "INSERT INTO ai_budget (run_id, reserved_micro_usd) VALUES ($1, $2)",
          [runId, reservedMicroUsd]
        );
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },
    async beginConversation(requestId, userText, mode) {
      const fingerprint = conversationFingerprint(requestId, userText, mode);
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query("LOCK TABLE conversation_turns IN EXCLUSIVE MODE");
        const existing = await client.query(
          "SELECT fingerprint,status FROM conversation_turns WHERE run_id=$1",
          [requestId]
        );
        if (existing.rows[0]) {
          if (existing.rows[0].fingerprint !== fingerprint)
            throw new Error(
              "Conversation request ID reused with different input"
            );
          await client.query("COMMIT");
          return existing.rows[0].status as "completed" | "pending";
        }
        await client.query(
          "INSERT INTO conversation_turns (run_id,fingerprint,user_text,mode,created_at) VALUES ($1,$2,$3,$4,$5)",
          [requestId, fingerprint, userText, mode, new Date().toISOString()]
        );
        await client.query(
          "UPDATE conversation_turns SET user_text=NULL,assistant=NULL WHERE seq NOT IN (SELECT seq FROM conversation_turns ORDER BY seq DESC LIMIT 50)"
        );
        await client.query("COMMIT");
        return "created";
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },
    async finishConversation(requestId, message) {
      const safe = assistantMessage(requestId, message);
      const result = await pool.query(
        "UPDATE conversation_turns SET assistant=CASE WHEN user_text IS NULL THEN NULL ELSE $1::jsonb END,status='completed' WHERE run_id=$2 AND status='pending'",
        [JSON.stringify(safe), requestId]
      );
      if (result.rowCount !== 1)
        throw new Error("Conversation request is missing or already completed");
    },
    async readConversation() {
      const result = await pool.query(
        "SELECT run_id,user_text,mode,created_at,assistant FROM conversation_turns WHERE user_text IS NOT NULL ORDER BY seq"
      );
      return conversationMessages(result.rows as ConversationRow[]);
    },
    async clearConversation() {
      await pool.query(
        "UPDATE conversation_turns SET user_text=NULL,assistant=NULL"
      );
    },
    async close() {
      await pool.end();
    },
  };
}

const globalStore = globalThis as typeof globalThis & {
  shopStores?: Partial<Record<WorkspaceMode, Promise<ShopStore>>>;
};
function store(workspace: WorkspaceMode): Promise<ShopStore> {
  const stores = (globalStore.shopStores ??= {});
  if (workspace !== "preview" && workspace !== "shop")
    throw new Error("Unknown workspace");
  if (!stores[workspace]) {
    if (workspace === "shop" && process.env.DATABASE_URL) {
      stores[workspace] = createPostgresStore(process.env.DATABASE_URL);
    } else {
      if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
        throw new Error(
          "MISSING: production DATABASE_URL; local preview storage is disabled"
        );
      }
      const filename =
        workspace === "preview"
          ? process.env.SHOP_PREVIEW_DB_PATH || ".local/shop-preview.sqlite"
          : process.env.SHOP_DB_PATH || ".local/shop.sqlite";
      stores[workspace] = createSqliteStore(
        resolve(filename),
        workspace === "preview" ? initialState : emptyState
      );
    }
    // Share one initialization attempt, but let a later request recover after failure.
    // Never automatically replay a business command or discard a newer cached store.
    const initializing = stores[workspace]!;
    const retryable: Promise<ShopStore> = initializing.catch((error) => {
      if (stores[workspace] === retryable) delete stores[workspace];
      throw error;
    });
    stores[workspace] = retryable;
  }
  return stores[workspace]!;
}

export async function readState(
  workspace: WorkspaceMode = "preview"
): Promise<ShopState> {
  return (await store(workspace)).read();
}
export async function executeCommand(
  command: Command,
  actor: string,
  workspace: WorkspaceMode = "preview"
): Promise<ShopState> {
  return (await store(workspace)).execute(command, actor);
}

function validateBudget(runId: string, reserved: number, maximum: number) {
  if (
    !/^[a-zA-Z0-9_-]{8,100}$/.test(runId) ||
    !Number.isSafeInteger(reserved) ||
    reserved <= 0 ||
    !Number.isSafeInteger(maximum) ||
    maximum <= 0
  ) {
    throw new Error("AI budget is not configured or request is invalid");
  }
}
export async function reserveAiBudget(
  runId: string,
  reservedMicroUsd: number,
  maxMicroUsd: number
): Promise<void> {
  return (await store("shop")).reserveBudget(
    runId,
    reservedMicroUsd,
    maxMicroUsd
  );
}

type ConversationRow = {
  run_id: string;
  user_text: string;
  mode: "local-guide" | "live";
  created_at: string;
  assistant: string | ConversationMessage | null;
};
function conversationFingerprint(
  requestId: string,
  userText: string,
  mode: string
): string {
  if (
    !/^[a-zA-Z0-9_-]{8,100}$/.test(requestId) ||
    typeof userText !== "string" ||
    !userText.trim() ||
    userText.length > 2000 ||
    !["local-guide", "live"].includes(mode)
  )
    throw new Error("Invalid conversation request");
  return createHash("sha256")
    .update(JSON.stringify({ userText, mode }))
    .digest("hex");
}
function assistantMessage(
  requestId: string,
  message: ConversationMessage
): ConversationMessage {
  if (
    message.role !== "assistant" ||
    message.requestId !== requestId ||
    message.id !== `${requestId}:assistant` ||
    typeof message.text !== "string" ||
    message.text.length > 12000 ||
    !["local-guide", "live", "system"].includes(message.mode) ||
    (message.cards &&
      (!Array.isArray(message.cards) || message.cards.length > 4))
  )
    throw new Error("Invalid trusted conversation result");
  const allowedCards = [
    "overview",
    "products",
    "order-intake",
    "order",
    "purchase",
    "money",
    "setup",
    "activity",
  ];
  if (
    message.cards?.some(
      (card) =>
        !card ||
        !allowedCards.includes(card.type) ||
        Object.keys(card).some(
          (key) => !["type", "title", "entityId"].includes(key)
        ) ||
        (card.title !== undefined &&
          (typeof card.title !== "string" || card.title.length > 100)) ||
        (card.entityId !== undefined &&
          (typeof card.entityId !== "string" || card.entityId.length > 100))
    )
  )
    throw new Error("Invalid trusted conversation cards");
  return {
    id: message.id,
    requestId,
    role: "assistant",
    text: message.text,
    mode: message.mode,
    ...(message.cards ? { cards: message.cards } : {}),
    createdAt: new Date().toISOString(),
  };
}
function conversationMessages(rows: ConversationRow[]): ConversationMessage[] {
  return rows.flatMap((row) => {
    const user: ConversationMessage = {
      id: `${row.run_id}:user`,
      requestId: row.run_id,
      role: "user",
      text: row.user_text,
      mode: row.mode,
      createdAt: row.created_at,
    };
    const messages = row.user_text ? [user] : [];
    return row.assistant
      ? [
          ...messages,
          typeof row.assistant === "string"
            ? (JSON.parse(row.assistant) as ConversationMessage)
            : row.assistant,
        ]
      : messages;
  });
}
export async function beginConversation(
  requestId: string,
  userText: string,
  mode: "local-guide" | "live",
  workspace: WorkspaceMode = "preview"
) {
  return (await store(workspace)).beginConversation(requestId, userText, mode);
}
export async function finishConversation(
  requestId: string,
  message: ConversationMessage,
  workspace: WorkspaceMode = "preview"
) {
  return (await store(workspace)).finishConversation(requestId, message);
}
export async function readConversation(workspace: WorkspaceMode = "preview") {
  return (await store(workspace)).readConversation();
}
export async function clearConversation(workspace: WorkspaceMode = "preview") {
  return (await store(workspace)).clearConversation();
}
