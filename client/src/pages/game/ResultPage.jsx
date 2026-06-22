// ─── ResultPage — Phase 4: Result ────────────────────────────────────────────
// Shows the final game result: score, whether the route was valid,
// and options to play again or view the ranking.

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom'; // Link navigates without reloading
import { api } from '../../api/client.js';

export default function ResultPage() {
  const { gameId } = useParams(); // game id from the URL
  const [game, setGame] = useState(null); // final game data
  const [error, setError] = useState('');

  // Load the final game data when the component mounts
  useEffect(() => {
    api
      .getGame(gameId)          // GET /api/games/:id
      .then((g) => setGame(g)) // store the game data (score, isValidRoute, etc.)
      .catch(() => setError('Unable to load result.'));
  }, [gameId]); // runs only on mount (gameId does not change)

  if (error) return <p className="error-msg">{error}</p>;
  if (!game) return <p className="status-msg">Loading result...</p>;

  return (
    <section className="page game-page">
      <h1>Phase 4 — Result</h1>

      {/* Shows a different message depending on whether the route was valid or not */}
      {!game.isValidRoute ? (
        <p className="error-msg">
          The route you submitted was invalid or incomplete. You lost all your coins.
        </p>
      ) : (
        <p>Well done! Your route was valid.</p>
      )}

      {/* Final score — ?? 0 is the nullish coalescing operator: uses 0 if score is null */}
      <p className="score-display">
        Final score: <strong>{game.score ?? 0}</strong> coins
      </p>

      <div className="result-actions">
        {/* Link works like an <a> but without reloading the page */}
        <Link to="/game/setup" className="btn-primary">
          New game {/* starts a new game from the beginning */}
        </Link>
        <Link to="/ranking" className="btn-secondary">
          View ranking {/* goes to the ranking page */}
        </Link>
      </div>
    </section>
  );
}
