import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "data", "weather.db");

export const db = new Database(dbPath);

db.pragma("journal_mode = WAL");

// Core table: one row per saved user request (location + date range + the
// weather data we fetched for it). This is what the CRUD endpoints operate on.
db.exec(`
  CREATE TABLE IF NOT EXISTS weather_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    query_input TEXT NOT NULL,        -- what the user typed (zip, city, coords, landmark...)
    resolved_name TEXT NOT NULL,      -- human-readable resolved location name
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    start_date TEXT NOT NULL,         -- YYYY-MM-DD
    end_date TEXT NOT NULL,           -- YYYY-MM-DD
    daily_data TEXT NOT NULL,         -- JSON array of {date, tempMax, tempMin, precipitation, weatherCode}
    notes TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

export default db;
