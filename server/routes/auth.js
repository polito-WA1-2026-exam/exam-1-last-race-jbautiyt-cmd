// ─── Authentication routes (/api/sessions) ────────────────────────────────────
// Handles login, logout and the current user query.

import { Router } from 'express'; // Router allows organising routes in separate files
import passport from 'passport';

const router = Router(); // creates an independent mini-router

// ── POST /api/sessions/login ──────────────────────────────────────────────────
// The client sends { username, password } in the body.
// Passport verifies the credentials with the LocalStrategy configured in passport.js.
router.post('/login', (req, res, next) => {
  // We use passport.authenticate in "custom callback" mode to be able to return JSON
  // (the standard mode would do a redirect, which does not work well with APIs)
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err); // internal server error

    if (!user) {
      // Wrong credentials: return 401 with the error message from the strategy
      return res.status(401).json({ error: info?.message || 'Invalid credentials' });
    }

    // req.logIn saves the user in the session (calls serializeUser internally)
    req.logIn(user, (loginErr) => {
      if (loginErr) return next(loginErr);

      // Successful login: return user data (without password)
      return res.json({
        id: user.id,
        username: user.username,
        bestScore: user.bestScore,
      });
    });
  })(req, res, next); // immediately invoked passing req, res, next
});

// ── POST /api/sessions/logout ─────────────────────────────────────────────────
// Closes the current user's session.
router.post('/logout', (req, res, next) => {
  req.logout((err) => {           // req.logout is a Passport method that clears req.user
    if (err) return next(err);

    req.session.destroy(() => {   // destroys the session on the server (removes the record from sessions.db)
      res.clearCookie('connect.sid'); // clears the session cookie from the user's browser
      res.json({ ok: true });
    });
  });
});

// ── GET /api/sessions/current ─────────────────────────────────────────────────
// Returns the currently logged-in user.
// The client calls this on startup to check if a session is already active.
router.get('/current', (req, res) => {
  if (!req.isAuthenticated()) {
    // No active session — the client will use this to show the "Log in" button
    return res.status(401).json({ error: 'Not authenticated' });
  }
  // Active session — return user data loaded by deserializeUser
  res.json({
    id: req.user.id,
    username: req.user.username,
    bestScore: req.user.bestScore,
  });
});

export default router;
