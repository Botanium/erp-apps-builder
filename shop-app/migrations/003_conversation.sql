-- Apply only to an explicitly authorized shop database after migrations 001 and 002.
-- One owner shop per database. Preview is local-only in its own SQLite database.
CREATE TABLE IF NOT EXISTS conversation_turns (
  seq BIGSERIAL PRIMARY KEY,
  run_id TEXT UNIQUE NOT NULL,
  fingerprint TEXT NOT NULL,
  user_text TEXT,
  mode TEXT NOT NULL CHECK (mode IN ('local-guide', 'live')),
  created_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  assistant JSONB
);
