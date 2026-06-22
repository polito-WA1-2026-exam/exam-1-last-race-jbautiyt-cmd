// ─── SQLite database connection ───────────────────────────────────────────────
// Uses the Singleton pattern: only ONE instance of the database is created,
// and all parts of the server share the same connection.

import Database from 'better-sqlite3'; // synchronous SQLite library (simpler than async alternatives)
import path from 'path';               // to build portable file paths
import { fileURLToPath } from 'url';   // needed in ES modules to obtain __dirname
import { seedDatabase } from './seed.js'; // function that inserts the initial data

const __dirname = path.dirname(fileURLToPath(import.meta.url)); // current directory (db/)
const dbPath = path.join(__dirname, 'lastrace.db');             // absolute path to the database file

let db; // module-level variable — initialised only the first time getDb() is called

// getDb() always returns the same database instance (Singleton)
export function getDb() {
  if (!db) {                          // if the connection does not exist yet...
    db = new Database(dbPath);        // create the SQLite file (or open it if it already exists)
    db.pragma('foreign_keys = ON');   // enable foreign key constraints (SQLite disables them by default)
    initSchema(db);                   // create tables if they don't exist
    seedDatabase(db);                 // insert initial data if the DB is empty
  }
  return db; // return the existing connection
}

// Creates all application tables if they do not exist yet
function initSchema(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      best_score INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS stations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      pos_x REAL NOT NULL,
      pos_y REAL NOT NULL,
      is_interchange INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS line_stations (
      line_id INTEGER NOT NULL,
      station_id INTEGER NOT NULL,
      position INTEGER NOT NULL,
      PRIMARY KEY (line_id, station_id),
      FOREIGN KEY (line_id) REFERENCES lines(id) ON DELETE CASCADE,
      FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS segments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      station_a_id INTEGER NOT NULL,
      station_b_id INTEGER NOT NULL,
      UNIQUE(station_a_id, station_b_id),
      FOREIGN KEY (station_a_id) REFERENCES stations(id) ON DELETE CASCADE,
      FOREIGN KEY (station_b_id) REFERENCES stations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT NOT NULL,
      effect INTEGER NOT NULL CHECK (effect >= -4 AND effect <= 4)
    );

    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      start_station_id INTEGER NOT NULL,
      end_station_id INTEGER NOT NULL,
      phase TEXT NOT NULL DEFAULT 'setup',
      route_json TEXT,
      coins INTEGER NOT NULL DEFAULT 20,
      score INTEGER,
      is_valid_route INTEGER,
      execution_json TEXT,
      execution_index INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (start_station_id) REFERENCES stations(id),
      FOREIGN KEY (end_station_id) REFERENCES stations(id)
    );
  `);
}
