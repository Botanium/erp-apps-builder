import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createSqliteStore } from "../src/lib/store";
import { emptyState } from "../src/lib/domain";
import type { ConversationMessage } from "../src/lib/conversation";
const reply = (id: string): ConversationMessage => ({
  id: `${id}:assistant`,
  requestId: id,
  role: "assistant",
  mode: "local-guide",
  text: "Review your products. No records changed.",
  cards: [{ type: "products" }],
  createdAt: new Date().toISOString(),
});

test("conversation persists independently of business revisions and remains workspace isolated", async () => {
  const dir = await mkdtemp(join(tmpdir(), "shop-chat-"));
  const file = join(dir, "shop.sqlite");
  let shop = await createSqliteStore(file, emptyState);
  const preview = await createSqliteStore(join(dir, "preview.sqlite"));
  try {
    assert.equal(
      await shop.beginConversation(
        "conversation-001",
        "Show products",
        "local-guide"
      ),
      "created"
    );
    await shop.finishConversation(
      "conversation-001",
      reply("conversation-001")
    );
    await shop.close();
    shop = await createSqliteStore(file, emptyState);
    assert.equal((await shop.readConversation()).length, 2);
    assert.equal((await shop.readConversation())[0].text, "Show products");
    assert.equal((await shop.read()).revision, 0);
    assert.equal((await preview.readConversation()).length, 0);
    assert.equal(
      await shop.beginConversation(
        "conversation-001",
        "Show products",
        "local-guide"
      ),
      "completed"
    );
    await assert.rejects(
      shop.beginConversation(
        "conversation-001",
        "Changed request",
        "local-guide"
      ),
      /different input/
    );
    await assert.rejects(
      shop.finishConversation("conversation-001", reply("conversation-001")),
      /already completed/
    );
  } finally {
    await shop.close();
    await preview.close();
    await rm(dir, { recursive: true });
  }
});

test("concurrent duplicate chat requests create one pending turn and validate trusted results", async () => {
  const dir = await mkdtemp(join(tmpdir(), "shop-chat-race-"));
  const left = await createSqliteStore(join(dir, "shop.sqlite"));
  const right = await createSqliteStore(join(dir, "shop.sqlite"));
  try {
    const states = await Promise.all([
      left.beginConversation("conversation-race", "Stock", "local-guide"),
      right.beginConversation("conversation-race", "Stock", "local-guide"),
    ]);
    assert.deepEqual(states.sort(), ["created", "pending"]);
    assert.equal((await left.readConversation()).length, 1);
    await assert.rejects(
      left.finishConversation("conversation-race", {
        ...reply("conversation-race"),
        role: "user",
      }),
      /Invalid trusted/
    );
    await assert.rejects(
      left.finishConversation("conversation-race", {
        ...reply("conversation-race"),
        cards: [{ type: "execute-sql" } as never],
      }),
      /Invalid trusted/
    );
    await right.finishConversation(
      "conversation-race",
      reply("conversation-race")
    );
    assert.equal((await left.readConversation()).length, 2);
  } finally {
    await left.close();
    await right.close();
    await rm(dir, { recursive: true });
  }
});

test("conversation retains at most fifty turn bodies and clearing preserves replay tombstones", async () => {
  const store = await createSqliteStore(":memory:");
  try {
    for (let i = 0; i < 51; i++) {
      const id = `conversation-retention-${i}`;
      await store.beginConversation(id, `Synthetic ${i}`, "local-guide");
      await store.finishConversation(id, reply(id));
    }
    assert.equal((await store.readConversation()).length, 100);
    assert.equal((await store.readConversation())[0].text, "Synthetic 1");
    assert.equal(
      await store.beginConversation(
        "conversation-retention-0",
        "Synthetic 0",
        "local-guide"
      ),
      "completed"
    );
    await store.clearConversation();
    assert.deepEqual(await store.readConversation(), []);
    assert.equal(
      await store.beginConversation(
        "conversation-retention-50",
        "Synthetic 50",
        "local-guide"
      ),
      "completed"
    );
    assert.equal((await store.read()).revision, 0);
  } finally {
    await store.close();
  }
});
