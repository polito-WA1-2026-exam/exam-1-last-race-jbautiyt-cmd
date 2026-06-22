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

const PLANNING_SECONDS = 90;

export default function PlanningPage() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [network, setNetwork] = useState(null);
  const [route, setRoute] = useState([]);
  const [secondsLeft, setSecondsLeft] = useState(PLANNING_SECONDS);
  const [error, setError] = useState('');

  // useRef for the submission flag: change is synchronous and does not cause a re-render.
  // This prevents a double submission if the user clicks exactly when the timer hits 0.
  const submittedRef = useRef(false);

  useEffect(() => {
    Promise.all([api.getGame(gameId), api.getPlanningNetwork()])
      .then(([g, net]) => {
        setGame(g);
        setNetwork(net);
      })
      .catch(() => setError('Game not found.'));
  }, [gameId]);

  // Effect 1: countdown — decrements secondsLeft by 1 every second.
  // The cleanup cancels the previous timer before creating a new one.
  useEffect(() => {
    if (!game || submittedRef.current || secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft, game]);

  // Effect 2: auto-submit when the timer reaches 0
  useEffect(() => {
    if (secondsLeft === 0 && game && !submittedRef.current) {
      submitRoute(route);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  const submitRoute = async (currentRoute) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    try {
      await api.submitRoute(gameId, currentRoute);
      navigate(`/game/execution/${gameId}`);
    } catch {
      setError('Error submitting route.');
      submittedRef.current = false;
    }
  };

  const handleSelectSegment = (seg) => {
    const key = `${Math.min(seg.stationAId, seg.stationBId)}-${Math.max(seg.stationAId, seg.stationBId)}`;

    setRoute((prev) => {
      const usedKeys = new Set(
        prev.map((s) => `${Math.min(s.fromId, s.toId)}-${Math.max(s.fromId, s.toId)}`)
      );
      if (usedKeys.has(key)) return prev;

      const currentId = prev.length === 0 ? game.startStation.id : prev[prev.length - 1].toId;

      let fromId;
      let toId;
      if (seg.stationAId === currentId) {
        fromId = seg.stationAId;
        toId = seg.stationBId;
      } else if (seg.stationBId === currentId) {
        fromId = seg.stationBId;
        toId = seg.stationAId;
      } else {
        fromId = seg.stationAId;
        toId = seg.stationBId;
      }

      return [...prev, { fromId, toId }];
    });
  };

  const handleUndo = () => setRoute((r) => r.slice(0, -1));

  if (error) return <p className="error-msg">{error}</p>;
  if (!game || !network) return <p className="status-msg">Loading planning...</p>;

  const stationNames = Object.fromEntries(network.stations.map((s) => [s.id, s.name]));
  const selectedKeys = new Set(
    route.map((seg) => `${Math.min(seg.fromId, seg.toId)}-${Math.max(seg.fromId, seg.toId)}`)
  );
  const routeWithNames = route.map((seg) => ({
    ...seg,
    fromName: stationNames[seg.fromId],
    toName: stationNames[seg.toId],
  }));

  return (
    <section className="page game-page planning-layout">
      <header className="planning-header">
        <h1>Phase 2 — Planning</h1>
        <p className={`timer ${secondsLeft <= 10 ? 'urgent' : ''}`}>
          Time left: <strong>{secondsLeft}s</strong>
        </p>
      </header>

      <div className="planning-grid">
        <div>
          <p>
            Start: <strong>{game.startStation.name}</strong> — Destination:{' '}
            <strong>{game.endStation.name}</strong>
          </p>
          <NetworkMap stations={network.stations} showLines={false} />
        </div>
        <SegmentList
          segments={network.segments}
          selectedKeys={selectedKeys}
          onSelect={handleSelectSegment}
          disabled={secondsLeft <= 0}
        />
      </div>

      <div className="route-summary-block">
        <RouteSummary
          route={routeWithNames}
          startStation={game.startStation}
          endStation={game.endStation}
        />
        <div className="planning-actions">
          <button type="button" onClick={handleUndo} disabled={route.length === 0}>
            Undo last segment
          </button>
          <button type="button" className="btn-primary" onClick={() => submitRoute(route)}>
            Submit route
          </button>
        </div>
      </div>
    </section>
  );
}