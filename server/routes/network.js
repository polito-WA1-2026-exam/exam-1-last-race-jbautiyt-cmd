// ─── Metro network routes (/api/network) ──────────────────────────────────────
// Returns station, line and segment data.
// There are two endpoints with different information depending on the game phase.

import { Router } from 'express';
import { getDb } from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// All routes in this file require authentication
router.use(requireAuth);

// ── GET /api/network/full ─────────────────────────────────────────────────────
// Returns ALL network information: stations, lines, which stations belong to each line, and segments.
// Used by the SETUP phase to show the full map with line colours.
router.get('/full', (_req, res) => {
  const db = getDb();

  // Query all stations with their coordinates and interchange flag
  // AS renames columns from snake_case (DB) to camelCase (API)
  const stations = db
    .prepare('SELECT id, name, pos_x AS x, pos_y AS y, is_interchange AS isInterchange FROM stations')
    .all();

  // Query all lines with their name and colour
  const lines = db.prepare('SELECT id, name, color FROM lines').all();

  // Query the line-station relationships, ordered by line and position
  // This lets the client know the order of stations on each line (to draw the routes)
  const lineStations = db
    .prepare(
      `SELECT line_id AS lineId, station_id AS stationId, position
       FROM line_stations ORDER BY line_id, position`
    )
    .all();

  // Query all segments (adjacent station pairs)
  const segments = db
    .prepare(
      `SELECT id, station_a_id AS stationAId, station_b_id AS stationBId FROM segments`
    )
    .all();

  // Return everything in a single object to minimise the number of client requests
  res.json({ stations, lines, lineStations, segments });
});

// ── GET /api/network/planning ─────────────────────────────────────────────────
// Returns ONLY stations and segments — without line information.
// Used by the PLANNING phase because the specification says the player must see
// the stations WITHOUT the connecting lines.
// Also includes station names in the segments so the client can display them directly.
router.get('/planning', (_req, res) => {
  const db = getDb();

  // Stations without the isInterchange field (not needed in Planning)
  const stations = db
    .prepare('SELECT id, name, pos_x AS x, pos_y AS y FROM stations')
    .all();

  // Segments with station names included via JOIN
  // So the client does not have to do the join manually
  const segments = db
    .prepare(
      `SELECT s.id, s.station_a_id AS stationAId, s.station_b_id AS stationBId,
              a.name AS stationAName, b.name AS stationBName
       FROM segments s
       JOIN stations a ON a.id = s.station_a_id  -- join with stations table to get name of A
       JOIN stations b ON b.id = s.station_b_id  -- join with stations table to get name of B
       ORDER BY a.name, b.name`                  -- alphabetical order so the list is readable
    )
    .all();

  res.json({ stations, segments });
});

export default router;
