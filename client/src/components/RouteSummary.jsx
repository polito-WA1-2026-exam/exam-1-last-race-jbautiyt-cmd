// ─── RouteSummary — summary of the route being built ────────────────────────
// Shows in real time the segments the player has selected.
// Updates every time the player adds or removes a segment.

// Props:
//   route: array of { fromId, toId, fromName, toName } — the selected segments
//   startStation: { id, name } — assigned start station
//   endStation: { id, name } — assigned destination station
export default function RouteSummary({ route, startStation, endStation }) {
  return (
    <div className="route-summary">
      <h3>Built route</h3>

      {/* Shows the start and destination stations assigned by the server */}
      <p>
        <strong>Start:</strong> {startStation?.name} {/* ?. avoids error if startStation is null */}
      </p>
      <p>
        <strong>Destination:</strong> {endStation?.name}
      </p>

      {/* If no segments have been selected, show a help message */}
      {route.length === 0 ? (
        <p className="hint">No segments selected.</p>
      ) : (
        // Numbered list of selected segments in order
        <ol>
          {route.map((seg, i) => (
            // The key combines fromId, toId and index to be unique even if a station is repeated
            <li key={`${seg.fromId}-${seg.toId}-${i}`}>
              Segment {i + 1}: {seg.fromName || seg.fromId} → {seg.toName || seg.toId}
              {/* fromName || fromId: use the name if available, or the id as fallback */}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
