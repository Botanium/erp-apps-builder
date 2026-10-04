-- Explicit operator migration only. No owner credentials or sessions are seeded.
CREATE TABLE IF NOT EXISTS auth_sessions (
  token_hash TEXT PRIMARY KEY,
  document JSONB NOT NULL,
  expires_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS auth_sessions_expiry ON auth_sessions (expires_at);
CREATE TABLE IF NOT EXISTS auth_attempts (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  count INTEGER NOT NULL CHECK (count >= 0),
  until_at BIGINT NOT NULL
);
