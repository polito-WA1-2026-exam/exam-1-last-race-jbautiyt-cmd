export default function HomePage() {
  return (
    <section className="page instructions-page">
      <h1>Last Race — Instructions</h1>
      <p>
        Welcome to <strong>Last Race</strong>, a single-player game inspired by
        &quot;Race the Rails&quot;. You must plan and follow a valid route on the underground network
        before time runs out, gaining or losing coins due to random events.
      </p>

      <h2>Objective</h2>
      <p>
        Reach the assigned destination station with the highest possible score. Your score is the
        number of coins left at the end of the game (minimum 0).
      </p>

      <h2>Game phases</h2>
      <ol>
        <li>
          <strong>Setup:</strong> view the full map with stations, connections, and lines. When you
          are ready, move on to the next phase.
        </li>
        <li>
          <strong>Planning (90 seconds):</strong> you see stations without lines, your start and
          destination, and the list of all segments. Select segments in sequence to build a valid
          route. Each segment can only be used once.
        </li>
        <li>
          <strong>Execution:</strong> for each segment of your route, a random event is shown and
          applied to your coins. If the route is invalid, you lose all your coins.
        </li>
        <li>
          <strong>Result:</strong> view your final score and start a new game if you wish.
        </li>
      </ol>

      <h2>Route rules</h2>
      <ul>
        <li>The route must start and end at the assigned stations.</li>
        <li>Each segment must exist on the network (adjacent stations on a line).</li>
        <li>Line changes are only allowed at interchange stations (served by more than one line).</li>
        <li>You may visit the same station more than once, but you cannot reuse the same segment.</li>
      </ul>

      <p className="hint">
        Anonymous visitors can only read these instructions. Log in to play and appear on the
        ranking.
      </p>
    </section>
  );
}
