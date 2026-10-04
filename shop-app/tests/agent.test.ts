import test from "node:test";
import assert from "node:assert/strict";
import { emptyState, initialState } from "../src/lib/domain";
import { createSqliteStore } from "../src/lib/store";
import {
  agentCapabilities,
  assertLiveEnabled,
  LIVE_MODEL,
  parseAgentInput,
  RESERVED_MICRO_USD,
  runAgent,
  validateCards,
  type AgentEvent,
} from "../src/lib/agent";

test("local guide explicitly identifies no-provider mode and never calls a provider or reserves budget", async () => {
  const state = initialState();
  const before = JSON.stringify(state);
  const events = [];
  for await (const event of runAgent(
    parseAgentInput({ message: "new order" }),
    state,
    new AbortController().signal,
    {
      fetch: async () => {
        throw new Error("provider forbidden");
      },
      reserve: async () => {
        throw new Error("budget forbidden");
      },
    }
  ))
    events.push(event);
  assert.match(JSON.stringify(events), /Local guide \(no model\/provider\)/);
  assert.match(JSON.stringify(events), /order-intake/);
  assert.equal(JSON.stringify(state), before);
});

test("input and card validation rejects unknown tools, oversized input and unauthorized entity IDs", () => {
  assert.throws(() => parseAgentInput({ message: "x".repeat(2001) }));
  assert.throws(() => parseAgentInput({ message: "hello", execute: true }));
  assert.throws(() => validateCards([{ type: "execute-sql" }], initialState()));
  assert.throws(() =>
    validateCards([{ type: "order", entityId: "nonexistent" }], initialState())
  );
  assert.throws(() =>
    validateCards([{ type: "overview", entityId: "any" }], initialState())
  );
  assert.throws(() =>
    validateCards([{ type: "products", html: "<script />" }], initialState())
  );
});

test("deterministic guide prioritizes purchase intent and unconfigured owner setup", async () => {
  for (const [state, message, card] of [
    [
      initialState(),
      "Review low stock and help me create a supplier purchase",
      "purchase",
    ],
    [initialState(), "Show my orders", "order"],
    [emptyState(), "Review stock", "setup"],
  ] as const) {
    const events = [];
    for await (const event of runAgent(
      parseAgentInput({ message }),
      state,
      new AbortController().signal
    ))
      events.push(event);
    assert.match(JSON.stringify(events), new RegExp(`"type":"${card}"`));
  }
});

test("existing-order list remains reachable beyond four records through one bounded app-owned card", async () => {
  const state = initialState();
  state.orders = Array.from({ length: 9 }, (_, index) => ({
    ...structuredClone(state.orders[0]),
    id: `order-${index}`,
  }));
  const before = JSON.stringify(state);
  const events: AgentEvent[] = [];
  for await (const event of runAgent(
    parseAgentInput({ message: "Show my orders and their next steps" }),
    state,
    new AbortController().signal
  ))
    events.push(event);
  const result = events.find((event) => event.event === "cards");
  assert.deepEqual(
    result?.data,
    { cards: [{ type: "order" }] },
    "list card contains no hidden latest-four window or copied order payload"
  );
  assert.deepEqual(validateCards([{ type: "order" }], state), [
    { type: "order" },
  ]);
  assert.deepEqual(
    validateCards([{ type: "order", entityId: "order-0" }], state),
    [{ type: "order", entityId: "order-0" }]
  );
  assert.throws(() =>
    validateCards([{ type: "order", entityId: "other-workspace-order" }], state)
  );
  assert.equal(JSON.stringify(state), before);
});

test("explicit order and payment review wins over channel or customer words without claiming filtering", async () => {
  for (const [message, expected] of [
    ["Show my Instagram orders", "order"],
    ["Review WhatsApp orders", "order"],
    ["Review customer payments", "money"],
    ["Help me record a new customer order", "order-intake"],
    ["Create a new WhatsApp order", "order-intake"],
    ["Instagram order intake", "order-intake"],
    ["Something unfamiliar", "overview"],
  ] as const) {
    const state = initialState();
    const before = JSON.stringify(state);
    const events: AgentEvent[] = [];
    for await (const event of runAgent(
      parseAgentInput({ message }),
      state,
      new AbortController().signal,
      {
        fetch: async () => {
          throw new Error("No provider allowed");
        },
        reserve: async () => {
          throw new Error("No reservation allowed");
        },
      }
    ))
      events.push(event);
    const cards = events.find((event) => event.event === "cards");
    assert.equal(cards?.data.cards[0].type, expected, message);
    assert.equal(JSON.stringify(state), before);
    if (expected === "order") {
      assert.deepEqual(cards?.data.cards, [{ type: "order" }]);
      const text = events
        .filter((event) => event.event === "text")
        .map((event) => event.data.text)
        .join("");
      assert.match(text, /all recorded orders/);
      assert.match(text, /not filtered by channel/);
      assert.doesNotMatch(text, /only Instagram|only WhatsApp/i);
    }
  }
});

test("new-order card labels distinguish synthetic preview from configured owner shop", async () => {
  for (const synthetic of [true, false]) {
    const state = synthetic ? initialState() : emptyState();
    if (!synthetic) state.setup.status = "configured";
    const events: AgentEvent[] = [];
    for await (const event of runAgent(
      parseAgentInput({ message: "Help me record a new customer order" }),
      state,
      new AbortController().signal
    ))
      events.push(event);
    const cards = events.find((event) => event.event === "cards");
    assert.deepEqual(cards?.data, {
      cards: [
        {
          type: "order-intake",
          title: synthetic ? "Draft a synthetic order" : "Draft a shop order",
        },
      ],
    });
  }
});

test("live paid requests fail closed by default and require explicit request consent", () => {
  const old = process.env.SHOP_AI_ENABLED;
  process.env.SHOP_AI_ENABLED = "false";
  try {
    assert.equal(agentCapabilities().liveAiEnabled, false);
    assert.throws(
      () => assertLiveEnabled(parseAgentInput({ message: "Hi", live: true })),
      /approval/
    );
    assert.throws(
      () =>
        assertLiveEnabled(
          parseAgentInput({
            message: "Hi",
            live: true,
            approvePaidCall: true,
            requestId: "mock-disabled-request",
          })
        ),
      /disabled/
    );
  } finally {
    if (old === undefined) delete process.env.SHOP_AI_ENABLED;
    else process.env.SHOP_AI_ENABLED = old;
  }
});

test("mocked Responses provider streams typed text/cards, reserves durable cap and never mutates", async () => {
  const vars = [
    "SHOP_AI_ENABLED",
    "SHOP_AI_BUDGET_MICRO_USD",
    "OPENAI_API_KEY",
    "OPENAI_MODEL",
  ] as const;
  const previous = Object.fromEntries(
    vars.map((key) => [key, process.env[key]])
  );
  Object.assign(process.env, {
    SHOP_AI_ENABLED: "true",
    SHOP_AI_BUDGET_MICRO_USD: "60000",
    OPENAI_API_KEY: "mock-not-a-key",
    OPENAI_MODEL: LIVE_MODEL,
  });
  try {
    const state = initialState();
    state.orders[0].customer = "PRIVATE_CUSTOMER_SENTINEL";
    state.orders[0].phone = "PRIVATE_PHONE_SENTINEL";
    state.orders[0].address = "PRIVATE_ADDRESS_SENTINEL";
    state.orders[0].evidence = [
      {
        action: "test-only",
        reference: "PRIVATE_EVIDENCE_SENTINEL",
        actor: "test-only",
        revision: 0,
      },
    ];
    const before = JSON.stringify(state);
    const reservations: unknown[] = [];
    let calls = 0;
    const fixture = [
      {
        type: "response.output_text.delta",
        delta: "Review inventory before reserving.",
      },
      {
        type: "response.output_item.done",
        item: {
          type: "function_call",
          name: "show_cards",
          arguments: JSON.stringify({
            cards: [{ type: "products", title: "Inventory", entityId: null }],
          }),
        },
      },
      { type: "response.completed" },
    ]
      .map(
        (event) => `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`
      )
      .join("");
    const dependencies = {
      reserve: async (...args: [string, number, number]) => {
        reservations.push(args);
      },
      fetch: (async (url: string | URL | Request, init?: RequestInit) => {
        calls++;
        assert.equal(String(url), "https://api.openai.com/v1/responses");
        assert.equal(reservations.length, 1, "reserve before provider");
        const payload = JSON.parse(init?.body as string);
        assert.equal(payload.store, false);
        assert.equal(payload.stream, true);
        assert.equal(payload.max_output_tokens, 1200);
        assert.equal(
          payload.service_tier,
          "default",
          "project tier defaults must not silently change the approved price basis"
        );
        assert.equal(payload.parallel_tool_calls, false);
        assert.equal(payload.tools.length, 1);
        assert.equal(payload.tools[0].name, "show_cards");
        assert.equal(payload.model, LIVE_MODEL);
        assert.doesNotMatch(payload.input, /phone|address|customer|PRIVATE_/);
        return new Response(fixture, {
          headers: { "Content-Type": "text/event-stream" },
        });
      }) as typeof fetch,
    };
    const events = [];
    for await (const event of runAgent(
      parseAgentInput({
        message: "Review stock",
        live: true,
        approvePaidCall: true,
        requestId: "mock-live-request",
      }),
      state,
      new AbortController().signal,
      dependencies
    ))
      events.push(event);
    assert.equal(calls, 1);
    assert.equal((reservations[0] as unknown[])[1], RESERVED_MICRO_USD);
    assert.equal(JSON.stringify(state), before);
    assert.match(JSON.stringify(events), /products/);
    assert.equal(events.at(-1)?.event, "done");

    await assert.rejects(async () => {
      for await (const _ of runAgent(
        parseAgentInput({
          message: "hello",
          live: true,
          approvePaidCall: true,
          requestId: "mock-failed-request",
        }),
        state,
        new AbortController().signal,
        {
          ...dependencies,
          fetch: async () => {
            calls++;
            return new Response("{}", { status: 429 });
          },
        }
      )) {
        /* consume */
      }
    }, /HTTP 429/);
    assert.equal(calls, 2, "provider failure is never retried");
    let called = false;
    const abort = new AbortController();
    abort.abort();
    for await (const _ of runAgent(
      parseAgentInput({ message: "hello", live: true, approvePaidCall: true }),
      state,
      abort.signal,
      {
        ...dependencies,
        fetch: async () => {
          called = true;
          throw new Error("forbidden");
        },
      }
    )) {
      /* consume */
    }
    assert.equal(called, false);
  } finally {
    for (const key of vars) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
});

test("mocked malicious and incomplete provider responses fail without cards or writes", async () => {
  const vars = [
    "SHOP_AI_ENABLED",
    "SHOP_AI_BUDGET_MICRO_USD",
    "OPENAI_API_KEY",
    "OPENAI_MODEL",
  ] as const;
  const previous = Object.fromEntries(
    vars.map((key) => [key, process.env[key]])
  );
  Object.assign(process.env, {
    SHOP_AI_ENABLED: "true",
    SHOP_AI_BUDGET_MICRO_USD: "60000",
    OPENAI_API_KEY: "mock-not-a-key",
    OPENAI_MODEL: LIVE_MODEL,
  });
  try {
    for (const event of [
      {
        type: "response.output_item.done",
        item: {
          type: "function_call",
          name: "execute_command",
          arguments: "{}",
        },
      },
      { type: "response.output_text.delta", delta: "Partial" },
      { type: "response.incomplete" },
    ]) {
      const events: AgentEvent[] = [];
      await assert.rejects(async () => {
        for await (const output of runAgent(
          parseAgentInput({
            message: "hello",
            live: true,
            approvePaidCall: true,
            requestId: "mock-invalid-request",
          }),
          initialState(),
          new AbortController().signal,
          {
            reserve: async () => {},
            fetch: async () =>
              new Response(`data: ${JSON.stringify(event)}\n\n`),
          }
        ))
          events.push(output);
      });
      assert.equal(
        events.some((item) => item.event === "cards" || item.event === "done"),
        false
      );
    }
  } finally {
    for (const key of vars) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
});

test("tool-only completed live response supplies explicit app status without another provider call", async () => {
  const vars = [
    "SHOP_AI_ENABLED",
    "SHOP_AI_BUDGET_MICRO_USD",
    "OPENAI_API_KEY",
    "OPENAI_MODEL",
  ];
  const previous = Object.fromEntries(
    vars.map((key) => [key, process.env[key]])
  );
  Object.assign(process.env, {
    SHOP_AI_ENABLED: "true",
    SHOP_AI_BUDGET_MICRO_USD: "30000",
    OPENAI_API_KEY: "mock-not-a-key",
    OPENAI_MODEL: LIVE_MODEL,
  });
  try {
    const state = initialState();
    const before = JSON.stringify(state);
    let calls = 0;
    let reservations = 0;
    const fixture = [
      {
        type: "response.output_item.done",
        item: {
          type: "function_call",
          name: "show_cards",
          arguments: JSON.stringify({
            cards: [
              { type: "products", title: "Inventory review", entityId: null },
            ],
          }),
        },
      },
      { type: "response.completed" },
    ]
      .map((event) => `data: ${JSON.stringify(event)}\n\n`)
      .join("");
    const dependencies = {
      reserve: async () => {
        reservations++;
      },
      fetch: (async () => {
        calls++;
        return new Response(fixture);
      }) as typeof fetch,
    };
    const input = parseAgentInput({
      message: "Show products",
      live: true,
      approvePaidCall: true,
      requestId: "mock-tool-only-output",
    });
    const events: AgentEvent[] = [];
    for await (const event of runAgent(
      input,
      state,
      new AbortController().signal,
      dependencies
    ))
      events.push(event);
    assert.equal(calls, 1);
    assert.equal(reservations, 1);
    assert.equal(JSON.stringify(state), before);
    assert.match(
      events.find((event) => event.event === "text")?.data.text || "",
      /^App status:/
    );
    assert.equal(events.at(-1)?.event, "done");
    assert.equal(events.filter((event) => event.event === "cards").length, 1);
    await assert.rejects(async () => {
      for await (const _ of runAgent(
        input,
        state,
        new AbortController().signal,
        {
          ...dependencies,
          fetch: async () =>
            new Response('data: {"type":"response.completed"}\n\n'),
        }
      )) {
        /* consume */
      }
    }, /without usable guidance/);
  } finally {
    for (const key of vars) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
});

test("durable paid request ID prevents duplicate provider calls and never refunds reservation", async () => {
  const vars = [
    "SHOP_AI_ENABLED",
    "SHOP_AI_BUDGET_MICRO_USD",
    "OPENAI_API_KEY",
    "OPENAI_MODEL",
  ] as const;
  const previous = Object.fromEntries(
    vars.map((key) => [key, process.env[key]])
  );
  Object.assign(process.env, {
    SHOP_AI_ENABLED: "true",
    SHOP_AI_BUDGET_MICRO_USD: "30000",
    OPENAI_API_KEY: "mock-not-a-key",
    OPENAI_MODEL: LIVE_MODEL,
  });
  const store = await createSqliteStore(":memory:", emptyState);
  let calls = 0;
  const dependencies = {
    reserve: (id: string, amount: number, limit: number) =>
      store.reserveBudget(id, amount, limit),
    fetch: (async () => {
      calls++;
      return new Response("rejected", { status: 500 });
    }) as typeof fetch,
  };
  try {
    const input = parseAgentInput({
      message: "hello",
      live: true,
      approvePaidCall: true,
      requestId: "stable-paid-request",
    });
    await assert.rejects(async () => {
      for await (const _ of runAgent(
        input,
        emptyState(),
        new AbortController().signal,
        dependencies
      )) {
      }
    }, /HTTP 500/);
    await assert.rejects(async () => {
      for await (const _ of runAgent(
        input,
        emptyState(),
        new AbortController().signal,
        dependencies
      )) {
      }
    }, /Budget reservation rejected/);
    await assert.rejects(async () => {
      for await (const _ of runAgent(
        { ...input, requestId: "new-paid-request" },
        emptyState(),
        new AbortController().signal,
        dependencies
      )) {
      }
    }, /Budget reservation rejected/);
    assert.equal(calls, 1);
  } finally {
    await store.close();
    for (const key of vars) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
});

test("whitespace-only completed responses reject empty guidance or provide app status for validated cards", async () => {
  const vars = [
    "SHOP_AI_ENABLED",
    "SHOP_AI_BUDGET_MICRO_USD",
    "OPENAI_API_KEY",
    "OPENAI_MODEL",
  ];
  const previous = Object.fromEntries(
    vars.map((key) => [key, process.env[key]])
  );
  Object.assign(process.env, {
    SHOP_AI_ENABLED: "true",
    SHOP_AI_BUDGET_MICRO_USD: "30000",
    OPENAI_API_KEY: "mock-not-a-key",
    OPENAI_MODEL: LIVE_MODEL,
  });
  try {
    for (const withCards of [false, true]) {
      const state = initialState();
      const before = JSON.stringify(state);
      let calls = 0;
      let reservations = 0;
      const fixture = [
        { type: "response.output_text.delta", delta: " \n\t\u00a0" },
        ...(withCards
          ? [
              {
                type: "response.output_item.done",
                item: {
                  type: "function_call",
                  name: "show_cards",
                  arguments: JSON.stringify({ cards: [{ type: "products" }] }),
                },
              },
            ]
          : []),
        { type: "response.completed" },
      ]
        .map((event) => `data: ${JSON.stringify(event)}\n\n`)
        .join("");
      const dependencies = {
        reserve: async () => {
          reservations++;
        },
        fetch: (async () => {
          calls++;
          return new Response(fixture);
        }) as typeof fetch,
      };
      const events: AgentEvent[] = [];
      const consume = async () => {
        for await (const event of runAgent(
          parseAgentInput({
            message: "Show products",
            live: true,
            approvePaidCall: true,
            requestId: "mock-whitespace-output",
          }),
          state,
          new AbortController().signal,
          dependencies
        ))
          events.push(event);
      };
      if (withCards) {
        await consume();
        assert.ok(
          events.some(
            (event) =>
              event.event === "text" &&
              event.data.text.startsWith("App status:")
          )
        );
        assert.equal(
          events.filter((event) => event.event === "cards").length,
          1
        );
        assert.equal(events.at(-1)?.event, "done");
      } else {
        await assert.rejects(consume, /without usable guidance/);
        assert.equal(
          events.some(
            (event) => event.event === "done" || event.event === "cards"
          ),
          false
        );
      }
      assert.equal(calls, 1);
      assert.equal(reservations, 1);
      assert.equal(JSON.stringify(state), before);
    }
  } finally {
    for (const key of vars) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
});

test("cancellation immediately after durable reservation prevents provider call but retains budget", async () => {
  const vars = [
    "SHOP_AI_ENABLED",
    "SHOP_AI_BUDGET_MICRO_USD",
    "OPENAI_API_KEY",
    "OPENAI_MODEL",
  ] as const;
  const previous = Object.fromEntries(
    vars.map((key) => [key, process.env[key]])
  );
  Object.assign(process.env, {
    SHOP_AI_ENABLED: "true",
    SHOP_AI_BUDGET_MICRO_USD: "30000",
    OPENAI_API_KEY: "mock-not-a-key",
    OPENAI_MODEL: LIVE_MODEL,
  });
  const store = await createSqliteStore(":memory:", emptyState);
  const abort = new AbortController();
  let calls = 0;
  const input = parseAgentInput({
    message: "hello",
    live: true,
    approvePaidCall: true,
    requestId: "cancel-after-reserve",
  });
  try {
    const dependencies = {
      reserve: async (id: string, amount: number, cap: number) => {
        await store.reserveBudget(id, amount, cap);
        abort.abort();
      },
      fetch: (async () => {
        calls++;
        throw new Error("Must not send");
      }) as typeof fetch,
    };
    for await (const _ of runAgent(
      input,
      emptyState(),
      abort.signal,
      dependencies
    )) {
    }
    assert.equal(calls, 0);
    await assert.rejects(
      () => store.reserveBudget(input.requestId!, 30000, 30000),
      /already reserved/
    );
    await assert.rejects(
      () => store.reserveBudget("another-request", 30000, 30000),
      /budget exhausted/
    );
  } finally {
    await store.close();
    for (const key of vars) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
});
