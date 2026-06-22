// ─── Ranking routes (/api/ranking) ────────────────────────────────────────────
// Returns the global ranking of all users by their best score.
// This route is PUBLIC — no authentication required (as specified).

import { Router } from 'express';
import { getDb } from '../db/database.js';

const router = Router();

// ── GET /api/ranking ──────────────────────────────────────────────────────────
// Returns all users ordered by best_score descending.
// In case of a tie, orders alphabetically by username.
router.get('/', (_req, res) => {
  const db = getDb();

  const ranking = db
    .prepare(
      `SELECT username, best_score AS bestScore
       FROM users
       ORDER BY best_score DESC, username ASC` // DESC = highest first; ASC = A-Z on ties
    )
    .all(); // .all() returns an array with all rows

  res.json({ ranking }); // wrapped in an object to keep the API extensible
});

export default router;
