/// ─── SetupPage — Phase 1: Setup ───────────────────────────────────────────────
// The player sees the full network map with all lines and colours.
// At the same time, the server creates the game and randomly assigns start and destination.
// When the player is ready, they click the button to move on to Planning.

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client.js';
import NetworkMap from '../../components/NetworkMap.jsx';

export default function SetupPage() {
  const navigate = useNavigate();
  const [network, setNetwork] = useState(null);
  const [game, setGame] = useState(null);
  const [error, setError] = useState('');

  // Promise.all runs both requests simultaneously and waits for both to finish
  useEffect(() => {
    Promise.all([api.getFullNetwork(), api.createGame()])
      .then(([net, g]) => {
        setNetwork(net);
        setGame(g);
      })
      .catch(() => setError('Error loading game.'));
  }, []);

  const handleContinue = async () => {
    if (!game) return;
    try {
      await api.advancePhase(game.id, 'planning');
      navigate(`/game/planning/${game.id}`);
    } catch {
      setError('Unable to move on to planning.');
    }
  };

  if (error) return <p className="error-msg">{error}</p>;
  if (!network || !game) return <p className="status-msg">Preparing game...</p>;

  return (
    <section className="page game-page">
      <h1>Phase 1 — Setup</h1>
      <p>Study the full metro network before planning your route.</p>
      <p>You start the game with 20 coins.</p>
      <NetworkMap
        stations={network.stations}
        lines={network.lines}
        lineStations={network.lineStations}
        showLines
      />
      <button type="button" className="btn-primary" onClick={handleContinue}>
        I&apos;m ready — go to planning
      </button>
    </section>
  );
}