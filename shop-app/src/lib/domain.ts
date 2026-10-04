export type Channel = "Instagram" | "WhatsApp" | "Website";
export type Product = {
  id: string;
  sku: string;
  name: string;
  category: string;
  priceMinor: number;
  stock: number;
  reserved: number;
  lowStockAt: number;
  synthetic: boolean;
};
export type Supplier = {
  id: string;
  name: string;
  contact: string;
  synthetic: boolean;
};
export type OrderLine = {
  productId: string;
  quantity: number;
  unitPriceMinor: number;
};
export type Order = {
  id: string;
  customer: string;
  channel: Channel;
  address: string;
  phone: string;
  lines: OrderLine[];
  totalMinor: number;
  status:
    | "draft"
    | "reserved"
    | "packed"
    | "dispatched"
    | "delivered"
    | "cancelled"
    | "delivery-failed"
    | "returned";
  paymentMethod: "COD" | "online";
  paymentStatus:
    | "due"
    | "pending"
    | "confirmed"
    | "collected"
    | "remitted"
    | "settled"
    | "not-due";
  evidence: {
    action: string;
    reference: string;
    actor: string;
    revision: number;
    recordedAt?: string;
  }[];
  synthetic: boolean;
};
export type PurchaseLine = {
  productId: string;
  quantity: number;
  unitCostMinor: number;
  receivedQuantity?: number;
  remainingQuantity?: number;
};
export type Receipt = {
  lines: { productId: string; quantity: number }[];
  reference: string;
  actor: string;
  revision: number;
  recordedAt?: string;
};
export type Purchase = {
  id: string;
  supplierId: string;
  lines: PurchaseLine[];
  totalMinor: number;
  status: "recorded" | "partially-received" | "received";
  reference: string;
  receiptReference?: string;
  receipts?: Receipt[];
  synthetic: boolean;
};
export type AuditEvent = {
  revision: number;
  action: string;
  actor: string;
  entityId: string;
  idempotencyKey: string;
  provenance: "human-recorded-preview" | "human-recorded-shop";
  summary: string;
  recordedAt?: string;
  stockChange?: {
    before: number;
    after: number;
    delta: number;
    reference: string;
  };
};
type Payloads = {
  "setup.configure": {
    businessName: string;
    currency: string;
    currencyDecimals: 0 | 2 | 3;
  };
  "product.create": {
    id: string;
    sku: string;
    name: string;
    category: string;
    priceMinor: number;
    lowStockAt: number;
  };
  "product.update": {
    productId: string;
    name: string;
    sku: string;
    priceMinor: number;
  };
  "stock.adjust": {
    productId: string;
    countedStock: number;
    reference: string;
  };
  "supplier.create": { id: string; name: string; contact: string };
  "purchase.create": {
    id: string;
    supplierId: string;
    lines: { productId: string; quantity: number; unitCostMinor: number }[];
    reference: string;
  };
  "purchase.receive": { purchaseId: string; reference: string };
  "purchase.receive-lines": {
    purchaseId: string;
    lines: { productId: string; quantity: number }[];
    reference: string;
  };
  "order.create": {
    id: string;
    customer: string;
    channel: Channel;
    address: string;
    phone: string;
    lines: { productId: string; quantity: number }[];
    paymentMethod: "COD" | "online";
  };
  "order.details": { orderId: string; address: string; phone: string };
  "order.reserve": { orderId: string };
  "order.pack": { orderId: string };
  "order.dispatch": { orderId: string; reference: string };
  "order.deliver": { orderId: string; reference: string };
  "order.delivery-failed": { orderId: string; reference: string };
  "order.return-received": {
    orderId: string;
    condition: "all-saleable";
    reference: string;
  };
  "order.cancel": { orderId: string; reference: string };
  "payment.record": {
    orderId: string;
    status: "confirmed" | "collected" | "remitted" | "settled";
    amountMinor: number;
    reference: string;
  };
};
export type CommandType = keyof Payloads;
export type Command = {
  [K in CommandType]: {
    idempotencyKey: string;
    expectedRevision: number;
    type: K;
    payload: Payloads[K];
  };
}[CommandType];
export type ShopState = {
  schemaVersion: 1 | 2;
  mode: "preview" | "shop";
  synthetic: boolean;
  currency: string;
  currencyDecimals: 0 | 2 | 3;
  revision: number;
  products: Product[];
  suppliers: Supplier[];
  purchases: Purchase[];
  orders: Order[];
  audit: AuditEvent[];
  processedCommands: Record<string, string>;
  setup: {
    status: "preview-only" | "unconfigured" | "configured";
    businessName: string;
    channelsConnected: false;
    paymentsConnected: false;
    liveAIEnabled: false;
  };
};
export class DomainError extends Error {
  code: "INVALID_COMMAND" | "CONFLICT" | "BUSINESS_RULE";
  constructor(
    message: string,
    code: "INVALID_COMMAND" | "CONFLICT" | "BUSINESS_RULE" = "BUSINESS_RULE"
  ) {
    super(message);
    this.name = "DomainError";
    this.code = code;
  }
}
export function initialState(): ShopState {
  const products: Product[] = [
    {
      id: "block",
      sku: "DEMO-BLOCK",
      name: "Demo building blocks",
      category: "Toys",
      priceMinor: 1200,
      stock: 3,
      reserved: 0,
      lowStockAt: 2,
      synthetic: true,
    },
    {
      id: "marker",
      sku: "DEMO-MARKER",
      name: "Demo marker set",
      category: "Art",
      priceMinor: 800,
      stock: 2,
      reserved: 0,
      lowStockAt: 2,
      synthetic: true,
    },
    {
      id: "notebook",
      sku: "DEMO-NOTEBOOK",
      name: "Demo notebook",
      category: "Stationery",
      priceMinor: 500,
      stock: 4,
      reserved: 0,
      lowStockAt: 2,
      synthetic: true,
    },
  ];
  return {
    schemaVersion: 2,
    mode: "preview",
    synthetic: true,
    currency: "DEMO",
    currencyDecimals: 2,
    revision: 0,
    products,
    suppliers: [
      {
        id: "supplier-demo",
        name: "Fictitious Creative Supply",
        contact: "Synthetic fixture — not a real supplier",
        synthetic: true,
      },
    ],
    purchases: [],
    orders: [
      {
        id: "ig-demo",
        customer: "Fictitious Instagram customer",
        channel: "Instagram",
        address: "",
        phone: "",
        lines: [
          { productId: "block", quantity: 1, unitPriceMinor: 1200 },
          { productId: "marker", quantity: 1, unitPriceMinor: 800 },
        ],
        totalMinor: 2000,
        paymentMethod: "COD",
        paymentStatus: "due",
      },
      {
        id: "wa-demo",
        customer: "Fictitious WhatsApp customer",
        channel: "WhatsApp",
        address: "Synthetic delivery address B",
        phone: "DEMO-CONTACT-B",
        lines: [
          { productId: "marker", quantity: 1, unitPriceMinor: 800 },
          { productId: "notebook", quantity: 2, unitPriceMinor: 500 },
        ],
        totalMinor: 1800,
        paymentMethod: "COD",
        paymentStatus: "due",
      },
      {
        id: "web-demo",
        customer: "Fictitious website customer",
        channel: "Website",
        address: "Synthetic delivery address C",
        phone: "DEMO-CONTACT-C",
        lines: [
          { productId: "block", quantity: 1, unitPriceMinor: 1200 },
          { productId: "marker", quantity: 1, unitPriceMinor: 800 },
        ],
        totalMinor: 2000,
        paymentMethod: "online",
        paymentStatus: "pending",
      },
    ].map((order) => ({
      ...order,
      status: "draft",
      evidence: [],
      synthetic: true,
    })) as Order[],
    audit: [],
    processedCommands: {},
    setup: {
      status: "preview-only",
      businessName: "Fictitious Creative Shop",
      channelsConnected: false,
      paymentsConnected: false,
      liveAIEnabled: false,
    },
  };
}
export function emptyState(): ShopState {
  return {
    schemaVersion: 2,
    mode: "shop",
    synthetic: false,
    currency: "",
    currencyDecimals: 2,
    revision: 0,
    products: [],
    suppliers: [],
    purchases: [],
    orders: [],
    audit: [],
    processedCommands: {},
    setup: {
      status: "unconfigured",
      businessName: "",
      channelsConnected: false,
      paymentsConnected: false,
      liveAIEnabled: false,
    },
  };
}
/** Read projection only: never persists, increments revision, or invents historical receipt events. */
export function normalizeState(state: ShopState): ShopState {
  requireRule(
    state && [1, 2].includes(state.schemaVersion),
    "Unsupported shop snapshot schema"
  );
  requireRule(Array.isArray(state.purchases), "Invalid purchase snapshot");
  const next = structuredClone(state);
  if (state.schemaVersion === 1) {
    requireRule(
      Array.isArray(next.orders) &&
        next.orders.every(
          (item) =>
            [
              "draft",
              "reserved",
              "packed",
              "dispatched",
              "delivered",
              "cancelled",
            ].includes(item.status) &&
            [
              "due",
              "pending",
              "confirmed",
              "collected",
              "remitted",
              "settled",
            ].includes(item.paymentStatus)
        ),
      "Unknown legacy order schema"
    );
  }
  for (const purchase of next.purchases) {
    lines(purchase.lines);
    if (state.schemaVersion === 1) {
      requireRule(
        ["recorded", "received"].includes(purchase.status) &&
          purchase.receipts === undefined &&
          purchase.lines.every(
            (line) =>
              line.receivedQuantity === undefined &&
              line.remainingQuantity === undefined
          ),
        "Unknown legacy receipt schema"
      );
      for (const line of purchase.lines) {
        integer(line.quantity, "legacy purchase quantity", 1);
        line.receivedQuantity =
          purchase.status === "received" ? line.quantity : 0;
        line.remainingQuantity =
          purchase.status === "received" ? 0 : line.quantity;
      }
      purchase.receipts = [];
    } else {
      requireRule(
        Array.isArray(purchase.receipts),
        "Missing receipt history in schema 2"
      );
      for (const line of purchase.lines) {
        integer(line.quantity, "purchase quantity", 1);
        integer(line.receivedQuantity, "received receipt quantity");
        integer(line.remainingQuantity, "remaining receipt quantity");
        requireRule(
          line.receivedQuantity <= line.quantity &&
            line.remainingQuantity === line.quantity - line.receivedQuantity,
          "Inconsistent receipt quantities"
        );
      }
      const expectedStatus = purchase.lines.every(
        (line) => line.receivedQuantity === 0
      )
        ? "recorded"
        : purchase.lines.every((line) => line.remainingQuantity === 0)
          ? "received"
          : "partially-received";
      requireRule(
        purchase.status === expectedStatus,
        "Inconsistent receipt status"
      );
    }
  }
  next.schemaVersion = 2;
  return next;
}
function fields(
  value: unknown,
  keys: string[]
): asserts value is Record<string, unknown> {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Object.prototype ||
    Object.keys(value).length !== keys.length ||
    Object.keys(value).some((k) => !keys.includes(k))
  )
    throw new DomainError("Unexpected or missing fields", "INVALID_COMMAND");
}
function text(
  value: unknown,
  label: string,
  empty = false
): asserts value is string {
  if (
    typeof value !== "string" ||
    (!empty && !value.trim()) ||
    value.length > 500 ||
    /[\u0000-\u001f]/.test(value)
  )
    throw new DomainError(`Invalid ${label}`, "INVALID_COMMAND");
}
function identifier(value: unknown): asserts value is string {
  text(value, "identifier");
  if (
    !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,99}$/.test(value) ||
    ["constructor", "prototype", "__proto__"].includes(value)
  )
    throw new DomainError("Invalid identifier", "INVALID_COMMAND");
}
function integer(
  value: unknown,
  label: string,
  min = 0
): asserts value is number {
  if (!Number.isSafeInteger(value) || (value as number) < min)
    throw new DomainError(
      `Invalid ${label}: safe integer required`,
      "INVALID_COMMAND"
    );
}
function requireRule(condition: unknown, message: string): asserts condition {
  if (!condition) throw new DomainError(message);
}
function canonical(value: unknown): string {
  return JSON.stringify(value, (_key, item) =>
    item && typeof item === "object" && !Array.isArray(item)
      ? Object.fromEntries(
          Object.entries(item).sort(([a], [b]) => a.localeCompare(b))
        )
      : item
  );
}
function product(state: ShopState, id: string): Product {
  identifier(id);
  const item = state.products.find((p) => p.id === id);
  requireRule(item, "Product not found");
  return item;
}
function order(state: ShopState, id: string): Order {
  identifier(id);
  const item = state.orders.find((o) => o.id === id);
  requireRule(item, "Order not found");
  return item;
}
function lines(value: unknown): asserts value is unknown[] {
  requireRule(
    Array.isArray(value) && value.length > 0 && value.length <= 100,
    "Provide 1–100 line items"
  );
}
const payloadFields: Record<CommandType, string[]> = {
  "setup.configure": ["businessName", "currency", "currencyDecimals"],
  "product.create": [
    "id",
    "sku",
    "name",
    "category",
    "priceMinor",
    "lowStockAt",
  ],
  "product.update": ["productId", "name", "sku", "priceMinor"],
  "stock.adjust": ["productId", "countedStock", "reference"],
  "supplier.create": ["id", "name", "contact"],
  "purchase.create": ["id", "supplierId", "lines", "reference"],
  "purchase.receive": ["purchaseId", "reference"],
  "purchase.receive-lines": ["purchaseId", "lines", "reference"],
  "order.create": [
    "id",
    "customer",
    "channel",
    "address",
    "phone",
    "lines",
    "paymentMethod",
  ],
  "order.details": ["orderId", "address", "phone"],
  "order.reserve": ["orderId"],
  "order.pack": ["orderId"],
  "order.dispatch": ["orderId", "reference"],
  "order.deliver": ["orderId", "reference"],
  "order.cancel": ["orderId", "reference"],
  "order.delivery-failed": ["orderId", "reference"],
  "order.return-received": ["orderId", "condition", "reference"],
  "payment.record": ["orderId", "status", "amountMinor", "reference"],
};
export function applyCommand(
  state: ShopState,
  command: Command,
  actor: string,
  recordedAt?: string
): ShopState {
  state = normalizeState(state);
  fields(command, ["idempotencyKey", "expectedRevision", "type", "payload"]);
  if (
    recordedAt !== undefined &&
    (typeof recordedAt !== "string" ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(recordedAt) ||
      !Number.isFinite(Date.parse(recordedAt)) ||
      new Date(recordedAt).toISOString() !== recordedAt)
  )
    throw new DomainError(
      "Invalid server recording timestamp",
      "INVALID_COMMAND"
    );
  identifier(command.idempotencyKey);
  integer(command.expectedRevision, "revision");
  text(actor, "human actor");
  if (
    typeof command.type !== "string" ||
    !Object.hasOwn(payloadFields, command.type)
  )
    throw new DomainError("Unsupported command", "INVALID_COMMAND");
  fields(command.payload, payloadFields[command.type]);
  if (
    command.type === "order.create" ||
    command.type === "purchase.create" ||
    command.type === "purchase.receive-lines"
  ) {
    lines(command.payload.lines);
    for (const line of command.payload.lines)
      fields(
        line,
        command.type === "purchase.create"
          ? ["productId", "quantity", "unitCostMinor"]
          : ["productId", "quantity"]
      );
  }
  const fingerprint = canonical({ command, actor });
  if (Object.hasOwn(state.processedCommands, command.idempotencyKey)) {
    if (state.processedCommands[command.idempotencyKey] !== fingerprint)
      throw new DomainError(
        "Idempotency key already used for different content or actor",
        "CONFLICT"
      );
    return structuredClone(state);
  }
  if (command.expectedRevision !== state.revision)
    throw new DomainError("State changed; review the latest state", "CONFLICT");
  requireRule(
    state.setup.status !== "unconfigured" || command.type === "setup.configure",
    "Configure the shop before recording business data"
  );
  const next = structuredClone(state);
  let entityId = "";
  let stockChange: AuditEvent["stockChange"];
  switch (command.type) {
    case "setup.configure": {
      const p = command.payload;
      fields(p, ["businessName", "currency", "currencyDecimals"]);
      text(p.businessName, "business name");
      text(p.currency, "currency");
      requireRule(
        next.mode === "shop",
        "Preview fixtures cannot be converted into a real shop"
      );
      requireRule(
        next.products.length +
          next.orders.length +
          next.purchases.length +
          next.suppliers.length ===
          0,
        "Setup is locked after business records exist"
      );
      requireRule(
        /^[A-Z]{3}$/.test(p.currency) &&
          Intl.supportedValuesOf("currency").includes(p.currency),
        "Unsupported currency code"
      );
      requireRule(
        [0, 2, 3].includes(p.currencyDecimals),
        "Currency precision must be 0, 2, or 3"
      );
      next.currency = p.currency;
      next.currencyDecimals = p.currencyDecimals;
      next.setup.businessName = p.businessName;
      next.setup.status = "configured";
      entityId = "shop";
      break;
    }
    case "product.create": {
      const p = command.payload;
      fields(p, ["id", "sku", "name", "category", "priceMinor", "lowStockAt"]);
      identifier(p.id);
      text(p.sku, "SKU");
      text(p.name, "name");
      text(p.category, "category");
      integer(p.priceMinor, "price", 1);
      integer(p.lowStockAt, "low stock threshold");
      requireRule(
        !next.products.some(
          (item) =>
            item.id === p.id ||
            item.sku.trim().toLowerCase() === p.sku.trim().toLowerCase()
        ),
        "Product ID or SKU already exists"
      );
      next.products.push({
        ...p,
        sku: p.sku.trim(),
        stock: 0,
        reserved: 0,
        synthetic: next.synthetic,
      });
      entityId = p.id;
      break;
    }
    case "product.update": {
      const p = command.payload;
      text(p.name, "name");
      text(p.sku, "SKU");
      integer(p.priceMinor, "price", 1);
      const item = product(next, p.productId);
      requireRule(
        !next.products.some(
          (other) =>
            other.id !== item.id &&
            other.sku.trim().toLowerCase() === p.sku.trim().toLowerCase()
        ),
        "Product SKU already exists"
      );
      item.name = p.name.trim();
      item.sku = p.sku.trim();
      item.priceMinor = p.priceMinor;
      entityId = item.id;
      break;
    }
    case "stock.adjust": {
      const p = command.payload;
      integer(p.countedStock, "physical count");
      text(p.reference, "reference");
      const item = product(next, p.productId);
      requireRule(
        p.countedStock >= item.reserved,
        "Physical count cannot be below reserved stock; resolve reservations before correcting this count"
      );
      stockChange = {
        before: item.stock,
        after: p.countedStock,
        delta: p.countedStock - item.stock,
        reference: p.reference,
      };
      item.stock = p.countedStock;
      entityId = item.id;
      break;
    }
    case "order.create": {
      const p = command.payload;
      fields(p, [
        "id",
        "customer",
        "channel",
        "address",
        "phone",
        "lines",
        "paymentMethod",
      ]);
      identifier(p.id);
      text(p.customer, "customer");
      text(p.address, "address", true);
      text(p.phone, "phone", true);
      requireRule(
        ["Instagram", "WhatsApp", "Website"].includes(p.channel),
        "Unknown channel"
      );
      requireRule(
        ["COD", "online"].includes(p.paymentMethod),
        "Unknown payment method"
      );
      requireRule(
        !next.orders.some((o) => o.id === p.id),
        "Order ID already exists"
      );
      lines(p.lines);
      const seen = new Set<string>();
      const captured = p.lines.map((line) => {
        fields(line, ["productId", "quantity"]);
        const item = product(next, line.productId);
        integer(line.quantity, "quantity", 1);
        requireRule(!seen.has(item.id), "Duplicate product line");
        seen.add(item.id);
        return { ...line, unitPriceMinor: item.priceMinor };
      });
      const totalMinor = captured.reduce(
        (sum, line) => sum + line.quantity * line.unitPriceMinor,
        0
      );
      integer(totalMinor, "order total", 1);
      next.orders.push({
        id: p.id,
        customer: p.customer,
        channel: p.channel,
        address: p.address,
        phone: p.phone,
        lines: captured,
        totalMinor,
        status: "draft",
        paymentMethod: p.paymentMethod,
        paymentStatus: p.paymentMethod === "COD" ? "due" : "pending",
        evidence: [],
        synthetic: next.synthetic,
      });
      entityId = p.id;
      break;
    }
    case "order.details": {
      const p = command.payload;
      fields(p, ["orderId", "address", "phone"]);
      text(p.address, "address");
      text(p.phone, "phone");
      const item = order(next, p.orderId);
      requireRule(
        item.status === "draft",
        "Delivery details can only change on a draft"
      );
      item.address = p.address;
      item.phone = p.phone;
      entityId = item.id;
      break;
    }
    case "order.reserve": {
      const p = command.payload;
      fields(p, ["orderId"]);
      const item = order(next, p.orderId);
      requireRule(
        item.status === "draft",
        "Only draft orders can reserve stock"
      );
      requireRule(
        item.address.trim() && item.phone.trim(),
        "Delivery details are required before reservation"
      );
      for (const line of item.lines) {
        const stock = product(next, line.productId);
        requireRule(
          stock.stock - stock.reserved >= line.quantity,
          `Insufficient available stock: ${stock.name}`
        );
      }
      for (const line of item.lines)
        product(next, line.productId).reserved += line.quantity;
      item.status = "reserved";
      entityId = item.id;
      break;
    }
    case "order.pack": {
      const p = command.payload;
      fields(p, ["orderId"]);
      const item = order(next, p.orderId);
      requireRule(
        item.status === "reserved",
        "Only reserved orders can be packed"
      );
      item.status = "packed";
      entityId = item.id;
      break;
    }
    case "order.dispatch": {
      const p = command.payload;
      fields(p, ["orderId", "reference"]);
      text(p.reference, "reference");
      const item = order(next, p.orderId);
      requireRule(
        item.status === "packed",
        "Only packed orders can be dispatched"
      );
      requireRule(
        item.paymentMethod !== "online" ||
          ["confirmed", "settled"].includes(item.paymentStatus),
        "Online payment must be manually confirmed before dispatch"
      );
      for (const line of item.lines) {
        const stock = product(next, line.productId);
        requireRule(
          stock.reserved >= line.quantity && stock.stock >= line.quantity,
          "Reserved stock is unavailable"
        );
        stock.reserved -= line.quantity;
        stock.stock -= line.quantity;
      }
      item.status = "dispatched";
      item.evidence.push({
        action: command.type,
        reference: p.reference,
        actor,
        revision: next.revision + 1,
        ...(recordedAt ? { recordedAt } : {}),
      });
      entityId = item.id;
      break;
    }
    case "order.deliver": {
      const p = command.payload;
      fields(p, ["orderId", "reference"]);
      text(p.reference, "reference");
      const item = order(next, p.orderId);
      requireRule(
        item.status === "dispatched",
        "Only dispatched orders can be delivered"
      );
      item.status = "delivered";
      item.evidence.push({
        action: command.type,
        reference: p.reference,
        actor,
        revision: next.revision + 1,
        ...(recordedAt ? { recordedAt } : {}),
      });
      entityId = item.id;
      break;
    }
    case "order.delivery-failed": {
      const p = command.payload;
      text(p.reference, "reference");
      const item = order(next, p.orderId);
      requireRule(
        item.status === "dispatched",
        "Unsuccessful delivery can only be recorded for a dispatched order"
      );
      requireRule(
        item.paymentMethod === "COD" && item.paymentStatus === "due",
        "Only unpaid COD delivery failure is supported; paid orders require an unsupported refund workflow"
      );
      item.status = "delivery-failed";
      item.evidence.push({
        action: command.type,
        reference: p.reference,
        actor,
        revision: next.revision + 1,
        ...(recordedAt ? { recordedAt } : {}),
      });
      entityId = item.id;
      break;
    }
    case "order.return-received": {
      const p = command.payload;
      text(p.reference, "reference");
      const item = order(next, p.orderId);
      requireRule(
        item.status === "delivery-failed",
        "Physical return requires a recorded failed delivery"
      );
      requireRule(
        item.paymentMethod === "COD" && item.paymentStatus === "due",
        "Only unpaid COD returns are supported; this does not refund payments"
      );
      requireRule(
        p.condition === "all-saleable",
        "Confirm all goods physically returned saleable; damaged, missing or partial returns are unsupported"
      );
      for (const line of item.lines) {
        const stock = product(next, line.productId);
        integer(stock.stock + line.quantity, "returned stock");
        stock.stock += line.quantity;
      }
      item.status = "returned";
      item.paymentStatus = "not-due";
      item.evidence.push({
        action: command.type,
        reference: p.reference,
        actor,
        revision: next.revision + 1,
        ...(recordedAt ? { recordedAt } : {}),
      });
      entityId = item.id;
      break;
    }
    case "payment.record": {
      const p = command.payload;
      fields(p, ["orderId", "status", "amountMinor", "reference"]);
      text(p.reference, "reference");
      integer(p.amountMinor, "amount", 1);
      const item = order(next, p.orderId);
      requireRule(
        !["cancelled", "returned"].includes(item.status),
        "Cancelled or returned orders cannot record payments"
      );
      requireRule(
        p.amountMinor === item.totalMinor,
        "Payment amount must equal the full order amount; partial payments are unsupported"
      );
      if (item.paymentMethod === "COD") {
        requireRule(
          ["collected", "remitted"].includes(p.status),
          "COD supports only collected and remitted records"
        );
        if (p.status === "collected") {
          requireRule(
            item.status === "delivered",
            "COD collection requires delivered status"
          );
          requireRule(item.paymentStatus === "due", "COD is no longer due");
        } else
          requireRule(
            item.paymentStatus === "collected",
            "COD must be collected before remittance"
          );
      } else {
        requireRule(
          ["confirmed", "settled"].includes(p.status),
          "Online supports only confirmed and settled records"
        );
        if (p.status === "confirmed")
          requireRule(
            item.paymentStatus === "pending",
            "Online payment is no longer pending"
          );
        else
          requireRule(
            item.paymentStatus === "confirmed",
            "Online payment must be confirmed before settlement"
          );
      }
      item.paymentStatus = p.status;
      item.evidence.push({
        action: `payment.${p.status}`,
        reference: p.reference,
        actor,
        revision: next.revision + 1,
        ...(recordedAt ? { recordedAt } : {}),
      });
      entityId = item.id;
      break;
    }
    case "order.cancel": {
      const p = command.payload;
      fields(p, ["orderId", "reference"]);
      text(p.reference, "reference");
      const item = order(next, p.orderId);
      requireRule(
        ["draft", "reserved", "packed"].includes(item.status),
        "Only pre-dispatch orders can be cancelled; returns are unsupported"
      );
      requireRule(
        ["due", "pending"].includes(item.paymentStatus),
        "Paid orders require a refund workflow; refunds are unsupported"
      );
      if (item.status !== "draft")
        for (const line of item.lines) {
          const stock = product(next, line.productId);
          requireRule(
            stock.reserved >= line.quantity,
            "Reservation is unavailable"
          );
          stock.reserved -= line.quantity;
        }
      item.status = "cancelled";
      item.evidence.push({
        action: command.type,
        reference: p.reference,
        actor,
        revision: next.revision + 1,
        ...(recordedAt ? { recordedAt } : {}),
      });
      entityId = item.id;
      break;
    }
    case "supplier.create": {
      const p = command.payload;
      fields(p, ["id", "name", "contact"]);
      identifier(p.id);
      text(p.name, "supplier name");
      text(p.contact, "contact", true);
      requireRule(
        !next.suppliers.some((s) => s.id === p.id),
        "Supplier ID already exists"
      );
      next.suppliers.push({ ...p, synthetic: next.synthetic });
      entityId = p.id;
      break;
    }
    case "purchase.create": {
      const p = command.payload;
      fields(p, ["id", "supplierId", "lines", "reference"]);
      identifier(p.id);
      identifier(p.supplierId);
      text(p.reference, "reference");
      lines(p.lines);
      requireRule(
        next.suppliers.some((s) => s.id === p.supplierId),
        "Supplier not found"
      );
      requireRule(
        !next.purchases.some((po) => po.id === p.id),
        "Purchase ID already exists"
      );
      const seen = new Set<string>();
      for (const line of p.lines) {
        fields(line, ["productId", "quantity", "unitCostMinor"]);
        product(next, line.productId);
        integer(line.quantity, "quantity", 1);
        integer(line.unitCostMinor, "unit cost", 1);
        requireRule(!seen.has(line.productId), "Duplicate product line");
        seen.add(line.productId);
      }
      const totalMinor = p.lines.reduce(
        (sum, line) => sum + line.quantity * line.unitCostMinor,
        0
      );
      integer(totalMinor, "purchase total", 1);
      next.purchases.push({
        ...structuredClone(p),
        lines: p.lines.map((line) => ({
          ...line,
          receivedQuantity: 0,
          remainingQuantity: line.quantity,
        })),
        receipts: [],
        totalMinor,
        status: "recorded",
        synthetic: next.synthetic,
      });
      entityId = p.id;
      break;
    }
    case "purchase.receive": {
      const p = command.payload;
      fields(p, ["purchaseId", "reference"]);
      identifier(p.purchaseId);
      text(p.reference, "reference");
      const purchase = next.purchases.find((po) => po.id === p.purchaseId);
      requireRule(purchase, "Purchase not found");
      requireRule(
        purchase.status === "recorded",
        "Full receipt requires an untouched purchase; already or partially received purchases need quantity-specific receiving"
      );
      for (const line of purchase.lines) {
        const item = product(next, line.productId);
        integer(item.stock + line.quantity, "resulting stock");
        item.stock += line.quantity;
        line.receivedQuantity = line.quantity;
        line.remainingQuantity = 0;
      }
      purchase.receipts!.push({
        lines: purchase.lines.map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
        })),
        reference: p.reference,
        actor,
        revision: next.revision + 1,
        ...(recordedAt ? { recordedAt } : {}),
      });
      purchase.status = "received";
      purchase.receiptReference = p.reference;
      entityId = purchase.id;
      break;
    }
    case "purchase.receive-lines": {
      const p = command.payload;
      identifier(p.purchaseId);
      text(p.reference, "reference");
      const purchase = next.purchases.find((po) => po.id === p.purchaseId);
      requireRule(purchase, "Purchase not found");
      requireRule(
        purchase.status !== "received",
        "Purchase has already been received"
      );
      const seen = new Set<string>();
      for (const arrival of p.lines) {
        identifier(arrival.productId);
        integer(arrival.quantity, "received quantity", 1);
        requireRule(
          !seen.has(arrival.productId),
          "Duplicate receipt product line"
        );
        seen.add(arrival.productId);
        const line = purchase.lines.find(
          (item) => item.productId === arrival.productId
        );
        requireRule(line, "Receipt product is not on this purchase");
        requireRule(
          arrival.quantity <= line.remainingQuantity!,
          "Received quantity exceeds remaining purchase quantity"
        );
        const item = product(next, arrival.productId);
        integer(item.stock + arrival.quantity, "resulting stock");
        item.stock += arrival.quantity;
        line.receivedQuantity! += arrival.quantity;
        line.remainingQuantity! -= arrival.quantity;
      }
      purchase.status = purchase.lines.every(
        (line) => line.remainingQuantity === 0
      )
        ? "received"
        : "partially-received";
      purchase.receipts!.push({
        lines: structuredClone(p.lines),
        reference: p.reference,
        actor,
        revision: next.revision + 1,
        ...(recordedAt ? { recordedAt } : {}),
      });
      entityId = purchase.id;
      break;
    }
    default:
      throw new DomainError("Unsupported command", "INVALID_COMMAND");
  }
  next.revision += 1;
  next.processedCommands[command.idempotencyKey] = fingerprint;
  next.audit.push({
    revision: next.revision,
    actor,
    action: command.type,
    entityId,
    idempotencyKey: command.idempotencyKey,
    provenance:
      next.mode === "preview"
        ? "human-recorded-preview"
        : "human-recorded-shop",
    summary: `${command.type}: ${entityId}`,
    ...(recordedAt ? { recordedAt } : {}),
    ...(stockChange ? { stockChange } : {}),
  });
  return next;
}
