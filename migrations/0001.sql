CREATE TABLE events (
  seq INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id TEXT NOT NULL UNIQUE,
  entry_id TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('save','remove')),
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX events_entry ON events(entry_id, seq);
CREATE TABLE write_limits (bucket TEXT PRIMARY KEY, count INTEGER NOT NULL DEFAULT 0);
