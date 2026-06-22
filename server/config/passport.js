// ─── Passport.js configuration ───────────────────────────────────────────────
// Passport is the library that manages authentication.
// Here we define WHAT "logging in" means and HOW to save/restore the user in the session.

import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local'; // strategy: login with username + password
import bcrypt from 'bcrypt';                                // to compare passwords against the stored hash
import { getDb } from '../db/database.js';

export function configurePassport() {

  // ── LocalStrategy ─────────────────────────────────────────────────────────
  // Defines what to do when someone tries to log in.
  // Passport calls this function with (username, password, done).
  // done(error, user, info) is the response callback.
  passport.use(
    new LocalStrategy((username, password, done) => {
      try {
        const db = getDb();

        // Look up the user in the database by username
        const user = db
          .prepare('SELECT id, username, password_hash, best_score FROM users WHERE username = ?')
          .get(username);

        if (!user) {
          // User does not exist — return false (no error, but no user either)
          return done(null, false, { message: 'Invalid credentials' });
        }

        // Compare the submitted password against the hash stored in the DB
        // bcrypt.compareSync is synchronous (blocks the thread, but acceptable for login)
        const match = bcrypt.compareSync(password, user.password_hash);

        if (!match) {
          // Password does not match — same generic response to avoid revealing whether the user exists
          return done(null, false, { message: 'Invalid credentials' });
        }

        // Successful login: return the user object (without the password hash for security)
        return done(null, {
          id: user.id,
          username: user.username,
          bestScore: user.best_score,
        });
      } catch (err) {
        return done(err); // unexpected error (e.g. DB unavailable)
      }
    })
  );

  // ── serializeUser ─────────────────────────────────────────────────────────
  // After a successful login, Passport calls serializeUser to decide
  // WHAT data to store in the server session.
  // We store only the id (not the full object) to minimise session size.
  passport.serializeUser((user, done) => {
    done(null, user.id); // the session will store: { passport: { user: <id> } }
  });

  // ── deserializeUser ───────────────────────────────────────────────────────
  // On EVERY authenticated request, Passport reads the id stored in the session
  // and calls deserializeUser to get the full user object.
  // The result is placed in req.user and is available in all handlers.
  passport.deserializeUser((id, done) => {
    try {
      const db = getDb();

      // Load the user by id (the session only stores the id, not the full object)
      const user = db
        .prepare('SELECT id, username, best_score FROM users WHERE id = ?')
        .get(id);

      if (!user) return done(null, false); // user was deleted after login

      done(null, {
        id: user.id,
        username: user.username,
        bestScore: user.best_score, // camelCase name for the API
      });
    } catch (err) {
      done(err);
    }
  });
}
