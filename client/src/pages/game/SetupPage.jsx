// ─── SetupPage — Phase 1: Setup ───────────────────────────────────────────────
// The player sees the full network map with all lines and colours.
// At the same time, the server creates the game and randomly assigns start and destination.
// When the player is ready, they click the button to move on to Planning.

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client.js';
import NetworkMap from '../../components/NetworkMap.jsx'; // SVG network map

export default function SetupPage() {
  const navigate = useNavigate();               // to navigate to the next page
  const [network, setNetwork] = useState(null); // full network data (stations + lines)
  const [game, setGame] = useState(null);       // newly created game (contains startStation and endStation)
  const [error, setError] = useState('');

  // When the component mounts, load the network AND create the game in parallel
  useEffect(() => {
    // Promise.all runs both requests simultaneously and waits for both to finish
    Promise.all([api.getFullNetwork(), api.createGame()])
      .then(([net, g]) => {
        setNetwork(net); // store network data
        setGame(g);      // store the created game (includes startStation, endStation, id)
      })
      .catch(() => setError('Error loading game.'));
  }, []); // empty array = only on mount

  // When the player clicks "I'm ready", advance the game to the Planning phase
  const handleContinue = async () => {
    if (!game) return; // safety: do nothing if the game has not loaded yet
    try {
      // Call the server to change the phase from 'setup' to 'planning'
      await api.advancePhase(game.id, 'planning');
      // Navigate to the Planning page, passing the game id in the URL
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

      {/* Full map with coloured lines (showLines=true by default) */}
      <NetworkMap
        stations={network.stations}
        lines={network.lines}
        lineStations={network.lineStations}
        showLines // boolean prop without value = true
      />

      <button type="button" className="btn-primary" onClick={handleContinue}>
        I&apos;m ready — go to planning {/* &apos; is the apostrophe in JSX */}
      </button>
    </section>
  );
}
