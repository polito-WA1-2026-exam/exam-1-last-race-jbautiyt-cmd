// ─── PlanningPage — Phase 2: Planning ────────────────────────────────────────
// The player has 90 seconds to build their route.
// They see the map WITHOUT lines, the assigned start/destination, and a list of segments.
// By selecting segments in order, they build their route.
// When time runs out or they click "Submit", the route is sent to the server.

import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/client.js';
import NetworkMap from '../../components/NetworkMap.jsx';
import SegmentList from '../../components/SegmentList.jsx';
import RouteSummary from '../../components/RouteSummary.jsx';

const PLANNING_SECONDS = 90; // timer duration in seconds

export default function PlanningPage() {
  const { gameId } = useParams();   // reads :gameId from the URL (/game/planning/123)
  const navigate = useNavigate();

  // Page state
  const [game, setGame] = useState(null);     // game data (startStation, endStation)
  const [network, setNetwork] = useState(null); // stations and segments (without lines)
  const [route, setRoute] = useState([]);       // array of { fromId, toId } — the route being built
  const [secondsLeft, setSecondsLeft] = useState(PLANNING_SECONDS); // remaining time
  const [error, setError] = useState('');

  // useRef: a "container" that persists between renders but whose change does NOT cause a re-render.
  // Used here to prevent the route being submitted twice if the user clicks
  // the button at the exact moment the timer reaches 0 (race condition).
  // With useState, React might batch the update and both calls would still see 'false'.
  // With useRef, the change is SYNCHRONOUS and immediate.
  const submittedRef = useRef(false);

  // Load game data and network on mount
  useEffect(() => {
    Promise.all([api.getGame(gameId), api.getPlanningNetwork()])
      .then(([g, net]) => {
        setGame(g);       // game data (startStation, endStation, etc.)
        setNetwork(net);  // stations + segments (without lines)
      })
      .catch(() => setError('Game not found.'));
  }, [gameId]); // re-runs if gameId changes (it does not change in this app, but is good practice)

  // Effect 1: COUNTDOWN — decrements secondsLeft by 1 every second
  // Cleaned up and re-created on every render triggered by secondsLeft changing
  useEffect(() => {
    if (!game || submittedRef.current || secondsLeft <= 0) return; // stop conditions

    // setTimeout executes the function ONCE after the given delay (1000ms = 1 second)
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);

    // The cleanup function cancels the timer if the effect re-runs before it fires
    // This is important: without cleanup, multiple timers could accumulate simultaneously
    return () => clearTimeout(timer);
  }, [secondsLeft, game]); // re-runs when secondsLeft or game changes

  // Effect 2: AUTO-SUBMIT — when the timer reaches 0, submit the route automatically
  useEffect(() => {
    if (secondsLeft === 0 && game && !submittedRef.current) {
      submitRoute(route); // submits whatever route the player has at that moment (even if incomplete)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]); // only reacts when secondsLeft changes; route is captured from the current closure

  // Submits the route to the server and navigates to the Execution phase
  const submitRoute = async (currentRoute) => {
    if (submittedRef.current) return; // guard: if already submitted, do nothing
    submittedRef.current = true;      // mark as submitted SYNCHRONOUSLY (before any await)

    try {
      await api.submitRoute(gameId, currentRoute); // PUT to the server with the route
      navigate(`/game/execution/${gameId}`);        // navigate to the execution phase
    } catch {
      setError('Error submitting route.');
      submittedRef.current = false; // if it fails, allow retrying
    }
  };

  // Adds a segment to the route when the player clicks on it
  const handleSelectSegment = (seg) => {
    // Normalise the key (always smaller-larger) to detect if already selected
    const key = `${Math.min(seg.stationAId, seg.stationBId)}-${Math.max(seg.stationAId, seg.stationBId)}`;
    if (selectedKeys.has(key)) return; // already selected, do not add again

    // Add the segment to the end of the route using functional state update
    // (prev => ...) guarantees we work with the most recent array value
    setRoute((prev) => [...prev, { fromId: seg.stationAId, toId: seg.stationBId }]);
  };

  // Removes the last segment added to the route (undoes the last step)
  const handleUndo = () => setRoute((r) => r.slice(0, -1)); // slice(0, -1) = everything except the last element

  // Early returns: shown before the main JSX if there is an error or data is loading
  if (error) return <p className="error-msg">{error}</p>;
  if (!game || !network) return <p className="status-msg">Loading planning...</p>;

  // Derived values (calculated from current state)
  // Map id → name to show names instead of ids in the RouteSummary
  const stationNames = Object.fromEntries(network.stations.map((s) => [s.id, s.name]));

  // Set of already-selected segment keys, so SegmentList knows which to mark green
  const selectedKeys = new Set(
    route.map((seg) => `${Math.min(seg.fromId, seg.toId)}-${Math.max(seg.fromId, seg.toId)}`)
  );

  // Enriches the route with station names (to display them in RouteSummary)
  const routeWithNames = route.map((seg) => ({
    ...seg,                              // copy fromId and toId
    fromName: stationNames[seg.fromId], // add the name of the origin station
    toName: stationNames[seg.toId],     // add the name of the destination station
  }));

  return (
    <section className="page game-page planning-layout">

      {/* Header with title and timer */}
      <header className="planning-header">
        <h1>Phase 2 — Planning</h1>
        {/* CSS class 'urgent' makes the timer red when 10 or fewer seconds remain */}
        <p className={`timer ${secondsLeft <= 10 ? 'urgent' : ''}`}>
          Time left: <strong>{secondsLeft}s</strong>
        </p>
      </header>

      {/* Two-column grid: map on the left, segment list on the right */}
      <div className="planning-grid">
        <div>
          <p>
            Start: <strong>{game.startStation.name}</strong> — Destination:{' '}
            <strong>{game.endStation.name}</strong>
          </p>
          {/* Map WITHOUT lines (showLines=false) — player must remember the network from Setup */}
          <NetworkMap stations={network.stations} showLines={false} />
        </div>

        {/* List of all segments for the player to select */}
        <SegmentList
          segments={network.segments}
          selectedKeys={selectedKeys}           // to mark already-selected ones in green
          onSelect={handleSelectSegment}        // callback when a segment is clicked
          disabled={secondsLeft <= 0}           // disable the list if time ran out
        />
      </div>

      {/* Bottom block: route summary and action buttons */}
      <div className="route-summary-block">
        <RouteSummary
          route={routeWithNames}                // route with station names
          startStation={game.startStation}
          endStation={game.endStation}
        />
        <div className="planning-actions">
          {/* Disable Undo if there are no segments to undo */}
          <button type="button" onClick={handleUndo} disabled={route.length === 0}>
            Undo last segment
          </button>
          {/* Manually submit the route (before the timer expires) */}
          <button type="button" className="btn-primary" onClick={() => submitRoute(route)}>
            Submit route
          </button>
        </div>
      </div>
    </section>
  );
}
