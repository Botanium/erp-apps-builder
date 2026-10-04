import {
  createHash,
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { authStore, type AuthSession, type AuthStore } from "./auth-store";
import { getOwnerConfig } from "./auth-config";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public code = "REQUEST_REJECTED"
  ) {
    super(message);
  }
}
const globals = globalThis as typeof globalThis & {
  shopPreviewSecret?: string;
};
const previewSecret = (globals.shopPreviewSecret ??=
  randomBytes(32).toString("hex"));
const cookieName = "shop_session";
const sessionSeconds = 60 * 60 * 8;
function ownerConfig() {
  try {
    return getOwnerConfig();
  } catch {
    throw new HttpError(
      503,
      "MISSING: valid private owner configuration. Configure the owner password, session secret and trusted app origin securely.",
      "AUTH_NOT_CONFIGURED"
    );
  }
}
async function withAuthStore<T>(
  operation: (store: AuthStore) => Promise<T>
): Promise<T> {
  try {
    return await operation(await authStore());
  } catch {
    throw new HttpError(
      503,
      "MISSING: accessible durable authentication storage. Check database connectivity and the explicit authentication schema migration.",
      "AUTH_STORAGE_UNAVAILABLE"
    );
  }
}

export function hostedRuntime(): boolean {
  return process.env.NODE_ENV === "production" || !!process.env.VERCEL;
}
function ownerConfiguration(): void {
  const config = ownerConfig();
  if (
    !config.appOrigin ||
    !/^scrypt\$[a-f0-9]{32}\$[a-f0-9]{128}$/.test(config.passwordHash) ||
    !/^[a-f0-9]{64,128}$/.test(config.sessionSecret)
  )
    throw new HttpError(
      503,
      "MISSING: owner password hash, strong session secret and trusted app origin. No public owner bootstrap is available.",
      "AUTH_NOT_CONFIGURED"
    );
  if (
    hostedRuntime() &&
    (!process.env.DATABASE_URL || !config.appOrigin.startsWith("https://"))
  )
    throw new HttpError(
      503,
      "MISSING: hosted authentication database and HTTPS app origin.",
      "HOSTED_NOT_READY"
    );
}
export function requestOrigin(request: Request): string {
  const url = new URL(request.url);
  const host = request.headers.get("host");
  // Next dev canonicalizes Request.url to localhost even when bound/accessed as 127.0.0.1.
  // Normalize only equal-port loopback aliases, never arbitrary forwarded origins.
  if (
    !hostedRuntime() &&
    host &&
    ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
  ) {
    let actual: URL;
    try {
      actual = new URL(`${url.protocol}//${host}`);
    } catch {
      throw new HttpError(403, "Invalid request host.");
    }
    if (
      ["localhost", "127.0.0.1", "[::1]"].includes(actual.hostname) &&
      actual.port === url.port
    )
      url.host = actual.host;
  }
  if (hostedRuntime()) ownerConfiguration();
  const configured = ownerConfig().appOrigin;
  if (configured) {
    let trusted: URL;
    try {
      trusted = new URL(configured);
    } catch {
      throw new HttpError(503, "Trusted app origin is invalid.");
    }
    if (
      trusted.origin !== configured ||
      trusted.username ||
      trusted.password ||
      !["http:", "https:"].includes(trusted.protocol)
    )
      throw new HttpError(
        503,
        "Trusted app origin must be a plain HTTP(S) origin."
      );
    if (url.origin !== trusted.origin)
      throw new HttpError(
        403,
        "Request does not match the configured app origin."
      );
  } else if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))
    throw new HttpError(403, "Local preview requires a loopback host.");
  if (host && host !== url.host) throw new HttpError(403, "Host mismatch.");
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (forwardedHost && forwardedHost !== url.host)
    throw new HttpError(403, "Proxy access is not enabled for local preview.");
  return url.origin;
}
export function requireSameOrigin(request: Request): void {
  const expected = requestOrigin(request);
  const origin = request.headers.get("origin");
  if (!origin || origin !== expected)
    throw new HttpError(
      403,
      "Same-origin request required.",
      "ORIGIN_REJECTED"
    );
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none")
    throw new HttpError(403, "Cross-site request rejected.");
}
function sessionToken(request: Request): string {
  const cookie = request.headers.get("cookie") ?? "";
  if (cookie.length > 8192) return "";
  return (
    cookie
      .split(";")
      .map((x) => x.trim())
      .find((x) => x.startsWith(`${cookieName}=`))
      ?.slice(cookieName.length + 1) ?? ""
  );
}
function tokenHash(token: string): string {
  return createHmac("sha256", ownerConfig().sessionSecret || previewSecret)
    .update(token)
    .digest("hex");
}
function credentialVersion(): string {
  return createHash("sha256").update(ownerConfig().passwordHash).digest("hex");
}
export async function requireSession(request: Request): Promise<AuthSession> {
  const origin = requestOrigin(request);
  const token = sessionToken(request);
  const session = /^[a-f0-9]{64}$/.test(token)
    ? await withAuthStore((store) => store.get(tokenHash(token)))
    : undefined;
  if (
    !session ||
    session.expiresAt <= Date.now() ||
    session.origin !== origin ||
    (session.mode === "owner" &&
      session.credentialVersion !== credentialVersion()) ||
    (hostedRuntime() && session.workspace === "preview")
  ) {
    throw new HttpError(
      401,
      "Sign in or explicitly enter local synthetic preview.",
      "UNAUTHENTICATED"
    );
  }
  return session;
}
/** A stale-tab precondition, never a workspace selector or substitute for authentication. */
export function requireWorkspace(
  request: Request,
  session: Pick<AuthSession, "workspace">
): void {
  if (request.headers.get("x-shop-workspace") !== session.workspace)
    throw new HttpError(
      409,
      "Your signed-in workspace changed. Reload before continuing; nothing was submitted.",
      "WORKSPACE_CHANGED"
    );
}
function passwordMatches(password: string): boolean {
  // Provisioned offline only; no HTTP registration or password bootstrap endpoint.
  const encoded = ownerConfig().passwordHash;
  if (!encoded)
    throw new HttpError(
      503,
      "Owner password authentication is not configured.",
      "AUTH_NOT_CONFIGURED"
    );
  const parts = encoded.split("$");
  if (
    parts.length !== 3 ||
    parts[0] !== "scrypt" ||
    !/^[a-f0-9]{32}$/.test(parts[1]) ||
    !/^[a-f0-9]{128}$/.test(parts[2])
  ) {
    throw new HttpError(
      503,
      "Owner password hash configuration is invalid.",
      "AUTH_NOT_CONFIGURED"
    );
  }
  const actual = scryptSync(password, Buffer.from(parts[1], "hex"), 64, {
    N: 32768,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  });
  return timingSafeEqual(actual, Buffer.from(parts[2], "hex"));
}
export async function createSession(
  request: Request,
  input: Record<string, unknown>
): Promise<string> {
  requireSameOrigin(request);
  let mode: AuthSession["mode"];
  if (input.mode === "preview" && Object.keys(input).length === 1) {
    if (
      hostedRuntime() ||
      !["localhost", "127.0.0.1", "[::1]"].includes(
        new URL(request.url).hostname
      )
    )
      throw new HttpError(
        403,
        "Synthetic preview is available only on a local development loopback host."
      );
    mode = "preview";
  } else if (
    input.mode === "shop" &&
    typeof input.password === "string" &&
    input.password.length >= 1 &&
    input.password.length <= 256 &&
    Object.keys(input).length === 2
  ) {
    ownerConfiguration();
    if (!(await withAuthStore((store) => store.attempt(Date.now()))))
      throw new HttpError(
        429,
        "Too many sign-in attempts. Try again after 15 minutes."
      );
    if (!passwordMatches(input.password))
      throw new HttpError(401, "Sign-in failed.");
    await withAuthStore((store) => store.resetAttempts());
    mode = "owner";
  } else
    throw new HttpError(
      400,
      "Expected an explicit preview choice or owner password."
    );
  const token = randomBytes(32).toString("hex");
  await withAuthStore((store) =>
    store.put(tokenHash(token), {
      mode,
      workspace: mode === "owner" ? "shop" : "preview",
      actor: mode === "preview" ? "local-preview-owner" : "owner",
      expiresAt: Date.now() + sessionSeconds * 1000,
      origin: requestOrigin(request),
      credentialVersion: credentialVersion(),
    })
  );
  return `${cookieName}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${sessionSeconds}${new URL(request.url).protocol === "https:" ? "; Secure" : ""}`;
}
export async function deleteSession(request: Request): Promise<string> {
  requireSameOrigin(request);
  await withAuthStore((store) =>
    store.remove(tokenHash(sessionToken(request)))
  );
  return `${cookieName}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${new URL(request.url).protocol === "https:" ? "; Secure" : ""}`;
}
export async function readJson(
  request: Request,
  maxBytes = 16_384
): Promise<Record<string, unknown>> {
  if (
    request.headers.get("content-type")?.split(";")[0].trim() !==
    "application/json"
  )
    throw new HttpError(415, "application/json required.");
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (!Number.isFinite(declared) || declared > maxBytes)
    throw new HttpError(413, "Request body too large.");
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "JSON body required.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > maxBytes) {
        await reader.cancel();
        throw new HttpError(413, "Request body too large.");
      }
      chunks.push(value);
    }
    const result: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!result || typeof result !== "object" || Array.isArray(result))
      throw new Error("not object");
    return result as Record<string, unknown>;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(400, "Malformed JSON object.");
  }
}
export function jsonResponse(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {}
): Response {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...headers,
    },
  });
}
export function errorResponse(error: unknown): Response {
  if (error instanceof HttpError)
    return jsonResponse(
      { error: error.message, code: error.code },
      error.status
    );
  if (error instanceof Error && error.name === "DomainError") {
    const code = (error as Error & { code: string }).code;
    return jsonResponse(
      { error: error.message, code },
      code === "INVALID_COMMAND" ? 400 : 409
    );
  }
  if (error instanceof Error && error.message.startsWith("MISSING:"))
    return jsonResponse(
      {
        error:
          "MISSING: required workspace persistence or initialization. Verify configured database access and explicit schema migrations.",
        code: "WORKSPACE_NOT_CONFIGURED",
      },
      503
    );
  return jsonResponse(
    {
      error: "The request could not be completed safely.",
      code: "INTERNAL_ERROR",
    },
    500
  );
}
