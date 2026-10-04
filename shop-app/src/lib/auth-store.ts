import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

export type AuthSession = {
  actor: string;
  mode: "preview" | "owner";
  workspace: "preview" | "shop";
  expiresAt: number;
  origin: string;
  credentialVersion: string;
};
export interface AuthStore {
  get(hash: string): Promise<AuthSession | undefined>;
  put(hash: string, session: AuthSession): Promise<void>;
  remove(hash: string): Promise<void>;
  attempt(now: number): Promise<boolean>;
  resetAttempts(): Promise<void>;
  close(): Promise<void>;
}
export async function createSqliteAuthStore(
  filename: string
): Promise<AuthStore> {
  const { DatabaseSync } = await import("node:sqlite");
  if (filename !== ":memory:")
    mkdirSync(dirname(filename), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(filename);
  db.exec(
    "PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS auth_sessions (token_hash TEXT PRIMARY KEY, document TEXT NOT NULL, expires_at INTEGER NOT NULL); CREATE TABLE IF NOT EXISTS auth_attempts (id INTEGER PRIMARY KEY, count INTEGER NOT NULL, until_at INTEGER NOT NULL)"
  );
  return {
    async get(hash) {
      const row = db
        .prepare(
          "SELECT document FROM auth_sessions WHERE token_hash=? AND expires_at>?"
        )
        .get(hash, Date.now()) as { document: string } | undefined;
      return row ? (JSON.parse(row.document) as AuthSession) : undefined;
    },
    async put(hash, session) {
      db.exec("BEGIN IMMEDIATE");
      try {
        db.prepare("DELETE FROM auth_sessions WHERE expires_at<=?").run(
          Date.now()
        );
        const row = db
          .prepare("SELECT COUNT(*) AS count FROM auth_sessions")
          .get() as { count: number };
        if (row.count >= 100) throw new Error("Session capacity reached");
        db.prepare(
          "INSERT INTO auth_sessions (token_hash,document,expires_at) VALUES (?,?,?)"
        ).run(hash, JSON.stringify(session), session.expiresAt);
        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    },
    async remove(hash) {
      db.prepare("DELETE FROM auth_sessions WHERE token_hash=?").run(hash);
    },
    async attempt(now) {
      db.exec("BEGIN IMMEDIATE");
      try {
        const prior = db
          .prepare("SELECT count,until_at FROM auth_attempts WHERE id=1")
          .get() as { count: number; until_at: number } | undefined;
        const row =
          prior && prior.until_at > now
            ? prior
            : { count: 0, until_at: now + 15 * 60_000 };
        const allowed = row.count < 5;
        db.prepare(
          "INSERT INTO auth_attempts (id,count,until_at) VALUES (1,?,?) ON CONFLICT(id) DO UPDATE SET count=excluded.count,until_at=excluded.until_at"
        ).run(Math.min(5, row.count + 1), row.until_at);
        db.exec("COMMIT");
        return allowed;
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    },
    async resetAttempts() {
      db.prepare("DELETE FROM auth_attempts WHERE id=1").run();
    },
    async close() {
      db.close();
    },
  };
}
export async function createPostgresAuthStore(
  connectionString: string
): Promise<AuthStore> {
  const { Pool } = await import("pg");
  const pool = new Pool({
    connectionString,
    max: 3,
    connectionTimeoutMillis: 5000,
  });
  // No automatic hosted schema creation. migration 002 must be explicitly applied by the operator.
  return {
    async get(hash) {
      const result = await pool.query(
        "SELECT document FROM auth_sessions WHERE token_hash=$1 AND expires_at>$2",
        [hash, Date.now()]
      );
      return result.rows[0]?.document as AuthSession | undefined;
    },
    async put(hash, session) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query("LOCK TABLE auth_sessions IN EXCLUSIVE MODE");
        await client.query("DELETE FROM auth_sessions WHERE expires_at<=$1", [
          Date.now(),
        ]);
        const result = await client.query(
          "SELECT COUNT(*) AS count FROM auth_sessions"
        );
        if (Number(result.rows[0].count) >= 100)
          throw new Error("Session capacity reached");
        await client.query(
          "INSERT INTO auth_sessions (token_hash,document,expires_at) VALUES ($1,$2::jsonb,$3)",
          [hash, JSON.stringify(session), session.expiresAt]
        );
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },
    async remove(hash) {
      await pool.query("DELETE FROM auth_sessions WHERE token_hash=$1", [hash]);
    },
    async attempt(now) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query("LOCK TABLE auth_attempts IN EXCLUSIVE MODE");
        const result = await client.query(
          "SELECT count,until_at FROM auth_attempts WHERE id=1"
        );
        const prior = result.rows[0];
        const row =
          prior && Number(prior.until_at) > now
            ? prior
            : { count: 0, until_at: now + 15 * 60_000 };
        const allowed = Number(row.count) < 5;
        await client.query(
          "INSERT INTO auth_attempts (id,count,until_at) VALUES (1,$1,$2) ON CONFLICT(id) DO UPDATE SET count=EXCLUDED.count,until_at=EXCLUDED.until_at",
          [Math.min(5, Number(row.count) + 1), row.until_at]
        );
        await client.query("COMMIT");
        return allowed;
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },
    async resetAttempts() {
      await pool.query("DELETE FROM auth_attempts WHERE id=1");
    },
    async close() {
      await pool.end();
    },
  };
}
const globals = globalThis as typeof globalThis & {
  shopAuthStores?: Map<string, Promise<AuthStore>>;
};
const stores = (globals.shopAuthStores ??= new Map());
export function authStore(): Promise<AuthStore> {
  const database = process.env.DATABASE_URL;
  if (database) {
    const key = `pg:${database}`;
    if (!stores.has(key)) stores.set(key, createPostgresAuthStore(database));
    return stores.get(key)!;
  }
  if (process.env.NODE_ENV === "production" || process.env.VERCEL)
    throw new Error("Hosted auth database missing");
  const filename = resolve(
    /* turbopackIgnore: true */ process.env.SHOP_AUTH_DB_PATH ||
      ".local/shop-auth.sqlite"
  );
  const key = `sqlite:${filename}`;
  if (!stores.has(key)) stores.set(key, createSqliteAuthStore(filename));
  return stores.get(key)!;
}
