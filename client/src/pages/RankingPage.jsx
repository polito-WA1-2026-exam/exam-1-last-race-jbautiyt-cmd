// ─── RankingPage — global ranking ─────────────────────────────────────────────
// Shows the best scores table for all users.
// This is a public page: no authentication required.

import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

export default function RankingPage() {
  const [ranking, setRanking] = useState([]);
  const [error, setError] = useState('');

  // Load the ranking from the server when the component mounts
  useEffect(() => {
    api
      .getRanking()
      .then((data) => setRanking(data.ranking))
      .catch(() => setError('Unable to load ranking.'));
  }, []);

  return (
    <section className="page ranking-page">
      <h1>General ranking</h1>
      <p>Best score recorded for each user (coins at the end of a valid game).</p>
      {error && <p className="error-msg">{error}</p>}
      <table className="ranking-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>User</th>
            <th>Best score</th>
          </tr>
        </thead>
        <tbody>
          {ranking.map((row, index) => (
            <tr key={row.username}>
              <td>{index + 1}</td>
              <td>{row.username}</td>
              <td>{row.bestScore}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}