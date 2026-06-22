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
  if (!db) {                          // if the connection does not exist yet…
    db = new Database(dbPath);        // …create the SQLite file (or open it if it already exists)
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
      id INTEGER PRIMARY KEY AUTOINCREMENT, -- unique auto-incremental identifier
      username TEXT NOT NULL UNIQUE,        -- username, cannot be repeated
      password_hash TEXT NOT NULL,          -- password hashed with bcrypt (never plain text)
      best_score INTEGER NOT NULL DEFAULT 0 -- user's best historical score
    );

    CREATE TABLE IF NOT EXISTS lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE, -- line name, e.g. "Red Line"
      color TEXT NOT NULL        -- color in hexadecimal format, e.g. "#c0392b"
    );

    CREATE TABLE IF NOT EXISTS stations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,         -- station name
      pos_x REAL NOT NULL,               -- X coordinate for drawing on the SVG map
      pos_y REAL NOT NULL,               -- Y coordinate for drawing on the SVG map
      is_interchange INTEGER NOT NULL DEFAULT 0 -- 1 if the station is served by more than one line
    );

    -- Bridge table (many-to-many) between lines and stations
    CREATE TABLE IF NOT EXISTS line_stations (
      line_id INTEGER NOT NULL,    -- reference to the line
      station_id INTEGER NOT NULL, -- reference to the station
      position INTEGER NOT NULL,   -- order of the station within the line (0, 1, 2…)
      PRIMARY KEY (line_id, station_id),                            -- unique combination
      FOREIGN KEY (line_id) REFERENCES lines(id) ON DELETE CASCADE,
      FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE
    );

    -- Adjacent station pairs (one segment = one stretch between two consecutive stations)
    CREATE TABLE IF NOT EXISTS segments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      station_a_id INTEGER NOT NULL, -- always the smaller id of the two (to avoid duplicates)
      station_b_id INTEGER NOT NULL, -- always the larger id of the two
      UNIQUE(station_a_id, station_b_id), -- no two identical segments allowed
      FOREIGN KEY (station_a_id) REFERENCES stations(id) ON DELETE CASCADE,
      FOREIGN KEY (station_b_id) REFERENCES stations(id) ON DELETE CASCADE
    );

    -- Random events that occur on each segment during execution
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT NOT NULL,                       -- descriptive text of the event
      effect INTEGER NOT NULL CHECK (effect >= -4 AND effect <= 4) -- coin effect (-4 to +4)
    );

    -- Complete state of each game played
    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,          -- who is playing this game
      start_station_id INTEGER NOT NULL, -- randomly assigned starting station
      end_station_id INTEGER NOT NULL,   -- randomly assigned destination station
      phase TEXT NOT NULL DEFAULT 'setup', -- current phase: 'setup', 'planning', 'execution', 'result'
      route_json TEXT,                   -- the route submitted by the player, stored as JSON
      coins INTEGER NOT NULL DEFAULT 20, -- current coins (start at 20)
      score INTEGER,                     -- final score (null until the game ends)
      is_valid_route INTEGER,            -- 1 if the route was valid, 0 if not
      execution_json TEXT,               -- execution steps with assigned events, stored as JSON
      execution_index INTEGER NOT NULL DEFAULT 0, -- index of the current step in the execution
      created_at TEXT NOT NULL DEFAULT (datetime('now')), -- creation date
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (start_station_id) REFERENCES stations(id),
      FOREIGN KEY (end_station_id) REFERENCES stations(id)
    );
  `);
}
