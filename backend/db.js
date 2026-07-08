import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "data");
const dbPath = path.join(dataDir, "weather.db");

fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(dbPath);

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS weather_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    query_input TEXT NOT NULL,
    resolved_name TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    daily_data TEXT NOT NULL,
    notes TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

export default db;
