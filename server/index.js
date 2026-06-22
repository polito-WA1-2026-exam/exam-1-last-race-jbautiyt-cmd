// ─── Server entry point ───────────────────────────────────────────────────────
// This file starts everything: configures middlewares, registers routes and starts the server.

import express from 'express';            // web framework for Node.js
import cors from 'cors';                  // middleware that allows cross-origin requests (client on a different port)
import session from 'express-session';    // middleware that manages user sessions on the server
import connectSqlite3 from 'connect-sqlite3'; // adapter to store sessions in a SQLite file
import passport from 'passport';         // authentication library
import path from 'path';                 // Node module for working with file paths
import { fileURLToPath } from 'url';     // utility to convert an ES module URL into a file path

import { getDb } from './db/database.js';           // database singleton
import { configurePassport } from './config/passport.js'; // configures the login strategy
import authRoutes from './routes/auth.js';           // routes: /api/sessions/login, logout, current
import networkRoutes from './routes/network.js';     // routes: /api/network/full, planning
import gamesRoutes from './routes/games.js';         // routes: /api/games/...
import rankingRoutes from './routes/ranking.js';     // routes: /api/ranking

// In ES modules (type: "module"), __dirname does not exist by default; it must be built like this:
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Connects the session store with SQLite (instead of the in-memory store, which is lost on restart)
const SQLiteStore = connectSqlite3(session);

// Initialises the database (creates tables if they don't exist and runs the initial seed)
getDb();

// Configures Passport: registers the LocalStrategy for login with username/password
configurePassport();

const app = express(); // creates the Express application
const port = 3001;     // port the server will listen on

// ─── Middlewares (executed in order for EVERY request) ────────────────────────

app.use(
  cors({
    origin: 'http://localhost:5173', // only allows requests from the React client
    credentials: true,               // required so the browser sends session cookies
  })
);

app.use(express.json()); // parses request bodies with Content-Type: application/json

app.use(
  session({
    store: new SQLiteStore({ db: 'sessions.db', dir: path.join(__dirname, 'db') }), // sessions file
    secret: 'last-race-exam-secret-change-in-production', // key to sign the cookie (in production this would be an env variable)
    resave: false,            // do not re-save the session if nothing changed
    saveUninitialized: false, // do not create a session until there is data (e.g. until the user logs in)
    cookie: {
      httpOnly: true,                  // the cookie is not accessible from browser JavaScript (security)
      maxAge: 24 * 60 * 60 * 1000,    // session duration: 24 hours in milliseconds
    },
  })
);

app.use(passport.initialize()); // initialises Passport on every request
app.use(passport.session());    // restores the user from the session (calls deserializeUser)

// ─── Routes ───────────────────────────────────────────────────────────────────

// Health route: allows checking the server is alive without authentication
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/sessions', authRoutes);   // login, logout, current
app.use('/api/network', networkRoutes); // metro network data
app.use('/api/games', gamesRoutes);     // game logic
app.use('/api/ranking', rankingRoutes); // global ranking

// ─── Global error handler ─────────────────────────────────────────────────────
// Express recognises it as an error handler because it receives 4 parameters (err, req, res, next)
app.use((err, _req, res, _next) => {
  console.error(err); // prints the full error in the server logs
  res.status(500).json({ error: 'Internal server error' }); // returns a generic message to the client
});

// Starts the server and begins listening on the given port
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
