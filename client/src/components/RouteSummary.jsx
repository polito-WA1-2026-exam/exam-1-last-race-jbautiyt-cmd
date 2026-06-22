// ─── RouteSummary — summary of the route being built ────────────────────────
// Shows in real time the segments the player has selected.
// Updates every time the player adds or removes a segment.

export default function RouteSummary({ route, startStation, endStation }) {
  return (
    <div className="route-summary">
      <h3>Built route</h3>
      <p>
        <strong>Start:</strong> {startStation?.name}
      </p>
      <p>
        <strong>Destination:</strong> {endStation?.name}
      </p>

      {route.length === 0 ? (
        <p className="hint">No segments selected.</p>
      ) : (
        <ol>
          {route.map((seg, i) => (
            <li key={`${seg.fromId}-${seg.toId}-${i}`}>
              Segment {i + 1}: {seg.fromName || seg.fromId} &rarr; {seg.toName || seg.toId}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}