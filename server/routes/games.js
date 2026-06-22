// ─── Game routes (/api/games) ──────────────────────────────────────────────────
// Manages the full lifecycle of a game: creation, phase advancement,
// route submission, and step-by-step execution.

import { Router } from 'express';
import { getDb } from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';
import {
  pickRandomStations,    // picks start and end stations at random (with minimum distance)
  validateRoute,         // checks that the submitted route is valid according to the rules
  buildExecutionSteps,   // builds execution steps with random events
  updateUserBestScore,   // updates the user's best_score if the new score is higher
} from '../services/gameService.js';

const router = Router();

// All game routes require the user to be authenticated
router.use(requireAuth);

// Helper: gets a station's name by its id
function getStationInfo(db, id) {
  return db.prepare('SELECT id, name FROM stations WHERE id = ?').get(id);
}

// Helper: transforms a DB row into the format expected by the client
// The DB stores snake_case and JSON as strings; the API uses camelCase and objects
function mapGameRow(db, row) {
  const start = getStationInfo(db, row.start_station_id); // object { id, name }
  const end = getStationInfo(db, row.end_station_id);     // object { id, name }
  return {
    id: row.id,
    phase: row.phase,                          // 'setup', 'planning', 'execution', 'result'
    coins: row.coins,                          // current coins
    score: row.score,                          // final score (null until result)
    isValidRoute: row.is_valid_route === 1,    // converts SQLite 0/1 to boolean
    startStation: start,                       // object { id, name }
    endStation: end,                           // object { id, name }
    route: row.route_json ? JSON.parse(row.route_json) : [], // converts JSON string to array
    executionIndex: row.execution_index,       // index of the current execution step
  };
}

// ── POST /api/games ────────────────────────────────────────────────────────────
// Creates a new game for the authenticated user.
// The server randomly picks the start and end stations.
router.post('/', (req, res) => {
  const db = getDb();

  // pickRandomStations guarantees start and end are at least 3 segments apart
  const { startId, endId } = pickRandomStations();

  // Insert the new game into the DB, in 'setup' phase with 20 initial coins
  const result = db
    .prepare(
      `INSERT INTO games (user_id, start_station_id, end_station_id, phase, coins)
       VALUES (?, ?, ?, 'setup', 20)`
    )
    .run(req.user.id, startId, endId); // req.user.id comes from Passport (authenticated user)

  // Retrieve the newly created game to return it to the client
  const game = db.prepare('SELECT * FROM games WHERE id = ?').get(result.lastInsertRowid);

  res.status(201).json(mapGameRow(db, game)); // 201 Created
});

// ── GET /api/games/:id ─────────────────────────────────────────────────────────
// Returns the current state of a game.
// The `user_id = ?` condition ensures a user cannot see other users' games.
router.get('/:id', (req, res) => {
  const db = getDb();
  const game = db
    .prepare('SELECT * FROM games WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.user.id); // req.params.id is the :id from the URL

  if (!game) return res.status(404).json({ error: 'Game not found' }); // 404 if not found or belongs to another user

  res.json(mapGameRow(db, game));
});

// ── POST /api/games/:id/advance ────────────────────────────────────────────────
// Advances the game to the next phase (only setup → planning).
// For planning → execution the transition is done by the route endpoint.
// For execution → result it is done by execution-next.
router.post('/:id/advance', (req, res) => {
  const db = getDb();
  const game = db
    .prepare('SELECT * FROM games WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.user.id);

  if (!game) return res.status(404).json({ error: 'Game not found' });

  const { phase } = req.body; // the target phase sent by the client

  // Validation: only known phases are accepted
  if (!['planning', 'execution', 'result'].includes(phase)) {
    return res.status(400).json({ error: 'Invalid phase' });
  }

  // Validation: phase transitions must happen in order
  if (phase === 'planning' && game.phase !== 'setup') {
    return res.status(400).json({ error: 'Cannot advance to planning from current phase' });
  }
  if (phase === 'execution' && game.phase !== 'planning') {
    return res.status(400).json({ error: 'Cannot advance to execution from current phase' });
  }
  if (phase === 'result' && game.phase !== 'execution') {
    return res.status(400).json({ error: 'Cannot advance to result from current phase' });
  }

  // Update the phase in the DB
  db.prepare('UPDATE games SET phase = ? WHERE id = ?').run(phase, game.id);

  // Retrieve and return the updated game
  const updated = db.prepare('SELECT * FROM games WHERE id = ?').get(game.id);
  res.json(mapGameRow(db, updated));
});

// ── PUT /api/games/:id/route ───────────────────────────────────────────────────
// Receives the route the player built during the Planning phase.
// This is the most important endpoint: validates the route, calculates the score
// and generates the execution steps with random events.
router.put('/:id/route', (req, res) => {
  const db = getDb();
  const game = db
    .prepare('SELECT * FROM games WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.user.id);

  if (!game) return res.status(404).json({ error: 'Game not found' });

  // Route can only be submitted during the Planning phase
  if (game.phase !== 'planning') {
    return res.status(400).json({ error: 'Route can only be submitted during planning' });
  }

  const route = req.body.route; // array of objects { fromId, toId }

  // Basic validation: must be an array
  if (!Array.isArray(route)) {
    return res.status(400).json({ error: 'Route must be an array' });
  }

  // Validate the route against the game rules (see gameService.js)
  const validation = validateRoute(game.start_station_id, game.end_station_id, route);

  // Variables calculated depending on whether the route is valid or not
  let coins = 20;
  let score = 0;
  let execution = [];
  let isValid = 0;

  if (validation.valid) {
    isValid = 1;

    // Build execution steps: assign a random event to each segment
    execution = buildExecutionSteps(route);

    // Calculate final coins by summing the effects of all events
    // reduce(accumulator, element) => adds effects one by one
    coins = 20 + execution.reduce((sum, step) => sum + step.event.effect, 0);

    // Score can never be negative (minimum 0)
    score = Math.max(0, coins);

    // Update the user's best_score if this score is better than the previous one
    updateUserBestScore(req.user.id, score);
  } else {
    // Invalid route: the player loses all coins (score = 0)
    coins = 0;
    score = 0;
  }

  // Save everything to the DB and automatically advance to the 'execution' phase
  db.prepare(
    `UPDATE games SET route_json = ?, phase = 'execution', coins = ?, score = ?,
     is_valid_route = ?, execution_json = ?, execution_index = 0
     WHERE id = ?`
  ).run(
    JSON.stringify(route),      // converts the array to a string for SQLite storage
    coins,
    score,
    isValid,
    JSON.stringify(execution),  // converts the execution steps to a string
    game.id
  );

  const updated = db.prepare('SELECT * FROM games WHERE id = ?').get(game.id);

  res.json({
    ...mapGameRow(db, updated), // spread: includes all game fields
    validation,                 // { valid: true/false, reason?: string }
    totalSteps: execution.length, // total number of execution steps
  });
});

// ── GET /api/games/:id/execution-step ─────────────────────────────────────────
// Returns the current execution step (the current segment and its event).
// The client calls this once per step to show the event to the player.
router.get('/:id/execution-step', (req, res) => {
  const db = getDb();
  const game = db
    .prepare('SELECT * FROM games WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.user.id);

  if (!game) return res.status(404).json({ error: 'Game not found' });

  // Steps can only be queried during the execution phase
  if (game.phase !== 'execution') {
    return res.status(400).json({ error: 'Game is not in execution phase' });
  }

  // Parse the execution steps array from the JSON stored in the DB
  const steps = game.execution_json ? JSON.parse(game.execution_json) : [];
  const index = game.execution_index; // index of the current step

  // Special case: route was invalid → return a special step indicating the penalty
  if (!game.is_valid_route) {
    return res.json({
      done: true,
      invalidRoute: true,
      coins: 0,
      score: 0,
      message: 'Invalid or incomplete route: you lose all your coins.',
    });
  }

  // If all steps have been processed, execution is complete
  if (index >= steps.length) {
    return res.json({
      done: true,
      invalidRoute: false,
      coins: game.coins,  // final coins (already calculated when the route was submitted)
      score: game.score,
    });
  }

  // Calculate current coins by accumulating effects from steps 0 to index (inclusive)
  // This allows showing the coin progress in real time to the player
  const step = steps[index];
  let runningCoins = 20; // always start with 20
  for (let i = 0; i <= index; i++) {
    runningCoins += steps[i].event.effect; // add each step's effect up to the current one
  }

  res.json({
    done: false,           // execution continues
    stepIndex: index,      // current step number (0-based)
    totalSteps: steps.length, // total steps
    step,                  // { fromStation, toStation, event }
    coins: runningCoins,   // coins after this step
  });
});

// ── POST /api/games/:id/execution-next ────────────────────────────────────────
// Advances to the next execution step.
// The client calls this when the player clicks "Next segment".
router.post('/:id/execution-next', (req, res) => {
  const db = getDb();
  const game = db
    .prepare('SELECT * FROM games WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.user.id);

  if (!game) return res.status(404).json({ error: 'Game not found' });

  const steps = game.execution_json ? JSON.parse(game.execution_json) : [];
  const nextIndex = game.execution_index + 1; // increment the index

  // Save the new index to the DB
  db.prepare('UPDATE games SET execution_index = ? WHERE id = ?').run(nextIndex, game.id);

  if (nextIndex >= steps.length) {
    // No more steps: advance to the 'result' phase
    db.prepare("UPDATE games SET phase = 'result' WHERE id = ?").run(game.id);
    return res.json({ done: true, phase: 'result', score: game.score, coins: game.coins });
  }

  // More steps remaining: return the new index so the client can load the next step
  res.json({ done: false, executionIndex: nextIndex });
});

export default router;
