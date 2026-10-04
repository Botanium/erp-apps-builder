// One owner-approved synthetic run only. No credentials or request bodies are journaled.
import assert from "node:assert/strict";
export const PLAN = Object.freeze({
  text: { count: 3, reserve: 30000 },
  transcribe: { count: 1, reserve: 6000 },
  speak: { count: 1, reserve: 20000 },
});
export function createGuard(db, nativeFetch, validateWav) {
  db.exec(`CREATE TABLE IF NOT EXISTS validation_control (id INTEGER PRIMARY KEY CHECK(id=1), armed INTEGER NOT NULL DEFAULT 0, halted INTEGER NOT NULL DEFAULT 0);
    INSERT OR IGNORE INTO validation_control(id) VALUES(1);
    CREATE TABLE IF NOT EXISTS validation_calls (id INTEGER PRIMARY KEY, kind TEXT NOT NULL, reserved INTEGER NOT NULL, started TEXT NOT NULL, outcome TEXT NOT NULL, evidence TEXT);`);
  const rows = () =>
    db.prepare("SELECT * FROM validation_calls ORDER BY id").all();
  const halt = () =>
    db
      .prepare("UPDATE validation_control SET halted=1,armed=0 WHERE id=1")
      .run();
  const arm = () => {
    assert.equal(rows().length, 0, "Never rearm a previously attempted run");
    db.prepare(
      "UPDATE validation_control SET armed=1 WHERE id=1 AND halted=0"
    ).run();
  };
  async function guardedFetch(input, init = {}) {
    let rowId, evidence;
    try {
      const url = String(input);
      assert.equal(init.method, "POST");
      assert.equal(new URL(url).origin, "https://api.openai.com");
      let kind;
      if (url === "https://api.openai.com/v1/responses") {
        kind = "text";
        const body = JSON.parse(init.body);
        assert.equal(body.model, "gpt-4.1-mini-2025-04-14");
        assert.equal(body.service_tier, "default");
        assert.equal(body.store, false);
        assert.equal(body.stream, true);
        assert.equal(body.max_output_tokens, 1200);
        assert.equal(body.tools.length, 1);
        assert.equal(body.tools[0].name, "show_cards");
        const bytes = Buffer.byteLength(init.body);
        assert.ok(bytes <= 24000);
        evidence = {
          model: body.model,
          serviceTier: body.service_tier,
          requestBytes: bytes,
          maxOutputTokens: 1200,
        };
      } else if (url === "https://api.openai.com/v1/audio/transcriptions") {
        kind = "transcribe";
        assert.ok(init.body instanceof FormData);
        assert.equal(init.body.get("model"), "whisper-1");
        assert.equal(init.body.get("language"), "en");
        assert.equal(init.body.get("response_format"), "json");
        const bytes = new Uint8Array(await init.body.get("file").arrayBuffer());
        const seconds = validateWav(bytes);
        evidence = {
          model: "whisper-1",
          requestAudioBytes: bytes.length,
          durationSeconds: seconds,
        };
      } else if (url === "https://api.openai.com/v1/audio/speech") {
        kind = "speak";
        const body = JSON.parse(init.body);
        assert.equal(body.model, "tts-1");
        assert.equal(body.voice, "alloy");
        assert.equal(body.response_format, "mp3");
        assert.equal(body.speed, 1);
        assert.ok(
          typeof body.input === "string" &&
            body.input.length > 0 &&
            body.input.length <= 1000
        );
        evidence = { model: "tts-1", inputCharacters: body.input.length };
      } else throw new Error("Unapproved provider endpoint");
      db.exec("BEGIN IMMEDIATE");
      try {
        const control = db
          .prepare("SELECT * FROM validation_control WHERE id=1")
          .get();
        const calls = rows();
        assert.equal(control.armed, 1, "Run not armed");
        assert.equal(control.halted, 0, "Run stopped");
        assert.ok(
          calls.every((call) => call.outcome === "completed"),
          "Uncertain or in-flight attempt blocks all further requests"
        );
        assert.ok(
          calls.filter((call) => call.kind === kind).length < PLAN[kind].count,
          "Per-type request maximum"
        );
        const reserved =
          calls.reduce((sum, call) => sum + call.reserved, 0) +
          PLAN[kind].reserve;
        assert.ok(
          reserved <= 116000 && reserved <= 250000 && calls.length < 5,
          "Aggregate hard ceiling"
        );
        rowId = Number(
          db
            .prepare(
              "INSERT INTO validation_calls(kind,reserved,started,outcome,evidence) VALUES(?,?,?,?,?)"
            )
            .run(
              kind,
              PLAN[kind].reserve,
              new Date().toISOString(),
              "attempted",
              JSON.stringify(evidence)
            ).lastInsertRowid
        );
        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
      // Explicit error on redirects: never follow a provider endpoint to another destination.
      const response = await nativeFetch(input, { ...init, redirect: "error" });
      evidence.httpStatus = response.status;
      evidence.providerRequestId = response.headers.get("x-request-id");
      assert.ok(
        response.ok,
        "Provider returned non-success; no retries allowed"
      );
      // Read a bounded clone before permitting the next call. The original remains usable by the real route.
      const reader = response.clone().body.getReader();
      const chunks = [];
      let length = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        length += value.length;
        assert.ok(length <= 1000000, "Response bound");
        chunks.push(Buffer.from(value));
      }
      const bytes = Buffer.concat(chunks);
      evidence.responseBytes = bytes.length;
      if (kind === "text") {
        const events = bytes
          .toString()
          .split("\n")
          .filter((line) => line.startsWith("data: "))
          .map((line) => line.slice(6))
          .filter((line) => line !== "[DONE]")
          .map((line) => JSON.parse(line));
        const final = events.find(
          (event) => event.type === "response.completed"
        )?.response;
        assert.ok(
          final?.usage && final.status === "completed",
          "Completed provider usage required"
        );
        assert.equal(final.model, "gpt-4.1-mini-2025-04-14");
        assert.equal(final.service_tier, "default");
        evidence.responseId = final.id;
        evidence.usage = final.usage;
        const cached = final.usage.input_tokens_details?.cached_tokens || 0;
        evidence.calculatedCostMicroUsd =
          (final.usage.input_tokens - cached) * 0.4 +
          cached * 0.1 +
          final.usage.output_tokens * 1.6;
      } else if (kind === "transcribe") {
        const parsed = JSON.parse(bytes.toString());
        assert.ok(typeof parsed.text === "string" && parsed.text.trim());
        evidence.providerUsage = parsed.usage ?? null;
        evidence.calculatedCostMicroUsd = evidence.durationSeconds * 100;
      } else {
        assert.ok(bytes.length > 100);
        evidence.providerUsage = null;
        evidence.calculatedCostMicroUsd = evidence.inputCharacters * 15;
      }
      assert.ok(
        evidence.calculatedCostMicroUsd <= PLAN[kind].reserve,
        "Calculated cost exceeded reservation"
      );
      db.prepare(
        "UPDATE validation_calls SET outcome=?,evidence=? WHERE id=?"
      ).run("completed", JSON.stringify(evidence), rowId);
      return response;
    } catch (error) {
      halt();
      if (rowId)
        db.prepare(
          "UPDATE validation_calls SET outcome=?,evidence=? WHERE id=?"
        ).run(
          "failed-or-uncertain",
          JSON.stringify({
            ...evidence,
            stoppedReason:
              error instanceof Error
                ? error.message.split("\n")[0]
                : "unknown outcome",
          }),
          rowId
        );
      throw new Error(
        "Validation guard stopped: " +
          (error instanceof Error
            ? error.message.split("\n")[0]
            : "unknown error")
      );
    }
  }
  return { fetch: guardedFetch, rows, arm, halt };
}
