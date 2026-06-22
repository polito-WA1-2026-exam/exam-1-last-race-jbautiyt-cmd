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

  // AS renames columns from snake_case (DB) to camelCase (API)
  const stations = db
    .prepare('SELECT id, name, pos_x AS x, pos_y AS y, is_interchange AS isInterchange FROM stations')
    .all();

  const lines = db.prepare('SELECT id, name, color FROM lines').all();

  // Ordered by line and position so the client knows the station order on each line (to draw routes)
  const lineStations = db
    .prepare(
      `SELECT line_id AS lineId, station_id AS stationId, position
       FROM line_stations ORDER BY line_id, position`
    )
    .all();

  const segments = db
    .prepare('SELECT id, station_a_id AS stationAId, station_b_id AS stationBId FROM segments')
    .all();

  // Return everything in a single object to minimise the number of client requests
  res.json({ stations, lines, lineStations, segments });
});

// ── GET /api/network/planning ─────────────────────────────────────────────────
// Returns ONLY stations and segments — without line information.
// Used by the PLANNING phase because the specification says the player must see
// the stations WITHOUT the connecting lines.
// Station names are included in the segments so the client can display them directly.
router.get('/planning', (_req, res) => {
  const db = getDb();

  // Stations without the isInterchange field (not needed in Planning)
  const stations = db
    .prepare('SELECT id, name, pos_x AS x, pos_y AS y FROM stations')
    .all();

  // Segments with station names included via JOIN so the client does not have to join manually.
  // Ordered alphabetically so the list is readable.
  const segments = db
    .prepare(
      `SELECT s.id, s.station_a_id AS stationAId, s.station_b_id AS stationBId,
              a.name AS stationAName, b.name AS stationBName
       FROM segments s
       JOIN stations a ON a.id = s.station_a_id
       JOIN stations b ON b.id = s.station_b_id
       ORDER BY a.name, b.name`
    )
    .all();

  res.json({ stations, segments });
});

export default router;
