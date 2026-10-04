-- Manual migration only. Do not run against any database without exact authorization.
-- Initial shop document requires approved real setup; no synthetic production seed.
CREATE TABLE IF NOT EXISTS shop_state (
  id TEXT PRIMARY KEY CHECK (id = 'primary'),
  document JSONB NOT NULL,
  CHECK (jsonb_typeof(document) = 'object')
);
CREATE TABLE IF NOT EXISTS ai_budget (
  run_id TEXT PRIMARY KEY,
  reserved_micro_usd BIGINT NOT NULL CHECK (reserved_micro_usd > 0)
);
