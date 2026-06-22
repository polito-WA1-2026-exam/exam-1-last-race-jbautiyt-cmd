// ─── Game business logic ──────────────────────────────────────────────────────
// This file contains the "smart" functions of the game:
// how to pick stations, how to validate a route, how to build the execution.
// Separating this logic from the routes makes the code more organised and testable.

import { getDb } from '../db/database.js';

// ── buildAdjacency ────────────────────────────────────────────────────────────
// Builds an adjacency map (graph) from the segments in the DB.
// An adjacency map says: "from station X I can go to [Y, Z, W]".
// Structure: Map { station_id => [neighbour_id1, neighbour_id2, ...] }
function buildAdjacency() {
  const db = getDb();
  const segments = db.prepare('SELECT station_a_id, station_b_id FROM segments').all();

  const adj = new Map(); // empty map: station_id → [neighbour ids]

  // addEdge adds the connection in both directions (segments are bidirectional)
  const addEdge = (a, b) => {
    if (!adj.has(a)) adj.set(a, []); // initialise the array if first time
    adj.get(a).push(b);              // A can go to B
    if (!adj.has(b)) adj.set(b, []); // initialise the array if first time
    adj.get(b).push(a);              // B can go to A (bidirectional)
  };

  segments.forEach((s) => addEdge(s.station_a_id, s.station_b_id));
  return adj;
}

// ── shortestPathLength ────────────────────────────────────────────────────────
// Calculates the shortest distance between two stations using BFS
// (Breadth-First Search).
// BFS guarantees finding the SHORTEST path in unweighted graphs.
// Returns the number of segments in the shortest path, or -1 if no path exists.
export function shortestPathLength(fromId, toId) {
  if (fromId === toId) return 0; // trivial case: same station

  const adj = buildAdjacency();

  // The queue stores pairs [station, distance_from_origin]
  const queue = [[fromId, 0]];

  // visited prevents processing the same station twice (avoids infinite loops)
  const visited = new Set([fromId]);

  while (queue.length > 0) {
    const [node, dist] = queue.shift(); // extract the first element (FIFO)

    for (const next of adj.get(node) || []) { // for each neighbour of the current station
      if (next === toId) return dist + 1;      // destination found! BFS guarantees this is the shortest

      if (!visited.has(next)) {       // if we haven't visited this neighbour yet
        visited.add(next);            // mark it as visited
        queue.push([next, dist + 1]); // add it to the queue with distance +1
      }
    }
  }

  return -1; // no path between the two stations
}

// ── pickRandomStations ────────────────────────────────────────────────────────
// Randomly picks a start and a destination station,
// guaranteeing that the distance between them is AT LEAST 3 segments
// (as required by the specification).
export function pickRandomStations() {
  const db = getDb();
  const stations = db.prepare('SELECT id FROM stations').all();
  const ids = stations.map((s) => s.id); // array of all station ids

  let startId;
  let endId;
  let attempts = 0;

  // Try to find a valid pair up to 500 times
  do {
    startId = ids[Math.floor(Math.random() * ids.length)]; // random id
    endId = ids[Math.floor(Math.random() * ids.length)];   // random id
    attempts++;
  } while (
    // Repeat if: same station OR distance is less than 3
    (startId === endId || shortestPathLength(startId, endId) < 3) &&
    attempts < 500 // safety limit to avoid infinite loop
  );

  // Fallback: if after 500 attempts no valid pair is found,
  // use the first and last stations in the list (guaranteed valid by the network design)
  if (startId === endId || shortestPathLength(startId, endId) < 3) {
    startId = ids[0];
    endId = ids[ids.length - 1];
  }

  return { startId, endId };
}

// ── getLinesForSegment ────────────────────────────────────────────────────────
// Returns the ids of lines that serve a specific segment (A-B).
// A segment belongs to a line if A and B are consecutive stations on that line
// (their position difference is exactly 1).
function getLinesForSegment(aId, bId) {
  const db = getDb();
  return db
    .prepare(
      `SELECT DISTINCT ls1.line_id AS line_id
       FROM line_stations ls1
       JOIN line_stations ls2 ON ls1.line_id = ls2.line_id  -- same line_id for both stations
       WHERE (
         (ls1.station_id = ? AND ls2.station_id = ?)  -- A comes before B
         OR (ls1.station_id = ? AND ls2.station_id = ?)  -- B comes before A
       )
       AND ABS(ls1.position - ls2.position) = 1`  -- they are adjacent positions (consecutive)
    )
    .all(aId, bId, bId, aId) // four parameters: A, B, B, A
    .map((r) => r.line_id);  // return only the array of ids
}

// ── segmentExists ─────────────────────────────────────────────────────────────
// Checks whether a segment between two stations exists in the DB.
// Uses Math.min/max to normalise the order (the DB always stores a_id < b_id).
function segmentExists(aId, bId) {
  const db = getDb();
  const row = db
    .prepare('SELECT id FROM segments WHERE station_a_id = ? AND station_b_id = ?')
    .get(Math.min(aId, bId), Math.max(aId, bId)); // normalise the order
  return !!row; // !! converts the object/null to boolean
}

// ── isInterchange ─────────────────────────────────────────────────────────────
// Checks whether a station is an interchange (served by more than one line).
function isInterchange(stationId) {
  const db = getDb();
  const row = db.prepare('SELECT is_interchange FROM stations WHERE id = ?').get(stationId);
  return row?.is_interchange === 1; // ?. (optional chaining) avoids error if row is null
}

// ── validateRoute ─────────────────────────────────────────────────────────────
// Validates a complete route according to the game rules.
// Returns { valid: true } or { valid: false, reason: '...' }.
export function validateRoute(startId, endId, route) {
  // Rule: the route cannot be empty
  if (!Array.isArray(route) || route.length === 0) {
    return { valid: false, reason: 'Route is empty' };
  }

  const first = route[0];             // first segment
  const last = route[route.length - 1]; // last segment

  // Rule: the route must start at the assigned station
  if (first.fromId !== startId) {
    return { valid: false, reason: 'Route does not start at assigned station' };
  }

  // Rule: the route must end at the assigned station
  if (last.toId !== endId) {
    return { valid: false, reason: 'Route does not end at assigned station' };
  }

  const usedSegments = new Set(); // to detect repeated segments
  let currentLine = null;         // current line (can change at interchange stations)

  for (let i = 0; i < route.length; i++) {
    const { fromId, toId } = route[i];

    // Rule: each segment must connect two different stations
    if (fromId === toId) {
      return { valid: false, reason: 'Zero-length segment' };
    }

    // Rule: segments must be connected (the toId of one = the fromId of the next)
    if (i > 0 && route[i - 1].toId !== fromId) {
      return { valid: false, reason: 'Segments are not connected' };
    }

    // Normalise the segment key (smaller-larger) to detect duplicates regardless of direction
    const segKey = `${Math.min(fromId, toId)}-${Math.max(fromId, toId)}`;

    // Rule: no segment can be used more than once
    if (usedSegments.has(segKey)) {
      return { valid: false, reason: 'Segment used more than once' };
    }
    usedSegments.add(segKey); // mark the segment as used

    // Rule: the segment must exist in the network
    if (!segmentExists(fromId, toId)) {
      return { valid: false, reason: 'Segment not in network' };
    }

    // Get which lines serve this segment
    const lines = getLinesForSegment(fromId, toId);

    // Rule: the segment must be served by at least one line
    if (lines.length === 0) {
      return { valid: false, reason: 'No line serves segment' };
    }

    if (currentLine === null) {
      // First segment: assign the initial line
      currentLine = lines[0];
    } else if (!lines.includes(currentLine)) {
      // The next segment is not on the current line → line change attempt
      // Rule: line changes are only valid at interchange stations
      if (!isInterchange(fromId)) {
        return { valid: false, reason: 'Line change at non-interchange station' };
      }
      // Switch to a line that serves the new segment
      currentLine = lines.find((l) => l !== currentLine) ?? lines[0];
    }
    // If lines.includes(currentLine), we stay on the same line → nothing to do
  }

  return { valid: true }; // all rules satisfied
}

// ── buildExecutionSteps ───────────────────────────────────────────────────────
// For each segment in the route, assigns a random event from the DB.
// Returns an array of steps with the full segment and event information.
export function buildExecutionSteps(route) {
  const db = getDb();
  const events = db.prepare('SELECT id, description, effect FROM events').all(); // all available events
  const getStation = db.prepare('SELECT id, name FROM stations WHERE id = ?');   // reusable prepared statement

  return route.map((seg) => {
    // Pick a random event from the list
    const event = events[Math.floor(Math.random() * events.length)];

    const from = getStation.get(seg.fromId); // name of the origin station
    const to = getStation.get(seg.toId);     // name of the destination station

    return {
      fromStation: { id: from.id, name: from.name },
      toStation: { id: to.id, name: to.name },
      event: { id: event.id, description: event.description, effect: event.effect },
    };
  });
}

// ── updateUserBestScore ───────────────────────────────────────────────────────
// Updates the user's best_score only if the new score is higher.
// Ensures best_score can never be negative.
export function updateUserBestScore(userId, score) {
  const db = getDb();
  const user = db.prepare('SELECT best_score FROM users WHERE id = ?').get(userId);
  const normalized = Math.max(0, score); // never store a negative score

  if (normalized > user.best_score) {
    // Only update if it is an improvement
    db.prepare('UPDATE users SET best_score = ? WHERE id = ?').run(normalized, userId);
  }
}
