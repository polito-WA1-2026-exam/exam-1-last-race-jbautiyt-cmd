// ─── RankingPage — global ranking ─────────────────────────────────────────────
// Shows the best scores table for all users.
// This is a public page: no authentication required.

import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

export default function RankingPage() {
  const [ranking, setRanking] = useState([]); // array of { username, bestScore }
  const [error, setError] = useState('');     // error message if loading fails

  // Load the ranking from the server when the component mounts
  useEffect(() => {
    api
      .getRanking()
      .then((data) => setRanking(data.ranking)) // data.ranking is the array of users
      .catch(() => setError('Unable to load ranking.'));
  }, []); // empty array = run only on mount

  return (
    <section className="page ranking-page">
      <h1>General ranking</h1>
      <p>Best score recorded for each user (coins at the end of a valid game).</p>

      {/* Show the error if loading failed */}
      {error && <p className="error-msg">{error}</p>}

      <table className="ranking-table">
        <thead>
          <tr>
            <th>Rank</th>       {/* position in the ranking */}
            <th>User</th>       {/* username */}
            <th>Best score</th> {/* best score recorded */}
          </tr>
        </thead>
        <tbody>
          {/* map generates one row per user; index+1 = position (1-based) */}
          {ranking.map((row, index) => (
            <tr key={row.username}> {/* unique key so React manages updates efficiently */}
              <td>{index + 1}</td>         {/* position: 1, 2, 3... */}
              <td>{row.username}</td>      {/* username */}
              <td>{row.bestScore}</td>     {/* best score */}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
