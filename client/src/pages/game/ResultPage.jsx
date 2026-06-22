// ─── ResultPage — Phase 4: Result ────────────────────────────────────────────
// Shows the final game result: score, whether the route was valid,
// and options to play again or view the ranking.

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api/client.js';

export default function ResultPage() {
  const { gameId } = useParams();
  const [game, setGame] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getGame(gameId)
      .then((g) => setGame(g))
      .catch(() => setError('Unable to load result.'));
  }, [gameId]);

  if (error) return <p className="error-msg">{error}</p>;
  if (!game) return <p className="status-msg">Loading result...</p>;

  return (
    <section className="page game-page">
      <h1>Phase 4 — Result</h1>
      {!game.isValidRoute ? (
        <p className="error-msg">
          The route you submitted was invalid or incomplete. You lost all your coins.
        </p>
      ) : (
        <p>Well done! Your route was valid.</p>
      )}
      <p className="score-display">
        Final score: <strong>{game.score ?? 0}</strong> coins
      </p>
      <div className="result-actions">
        <Link to="/game/setup" className="btn-primary">
          New game
        </Link>
        <Link to="/ranking" className="btn-secondary">
          View ranking
        </Link>
      </div>
    </section>
  );
}