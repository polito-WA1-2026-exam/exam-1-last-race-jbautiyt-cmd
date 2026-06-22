// ─── SegmentList — list of segments to select the route ──────────────────────
// Shows all network segments as clickable buttons.
// The player builds their route by clicking segments in order.
// Already selected segments are shown in green and cannot be selected again.

export default function SegmentList({ segments, selectedKeys, onSelect, disabled }) {
  // Checks whether a segment is already selected (checked in both directions A-B and B-A)
  const isSelected = (seg) =>
    selectedKeys.has(`${seg.stationAId}-${seg.stationBId}`) ||
    selectedKeys.has(`${seg.stationBId}-${seg.stationAId}`);

  return (
    <div className="segment-list-panel">
      <h3>Segment list</h3>
      <p className="hint">Select any segments to build your route.</p>
      <ul className="segment-list">
        {segments.map((seg) => (
          <li key={seg.id}>
            <button
              type="button"
              className={`segment-btn ${isSelected(seg) ? 'selected' : ''}`}
              disabled={disabled || isSelected(seg)}
              onClick={() => onSelect(seg)}
            >
              {seg.stationAName} — {seg.stationBName}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}