// ─── SegmentList — list of segments to select the route ──────────────────────
// Shows all network segments as clickable buttons.
// The player builds their route by clicking segments in order.
// Already selected segments are shown in green and cannot be selected again.

// Props:
//   segments: array of { id, stationAId, stationBId, stationAName, stationBName }
//   selectedKeys: Set of strings "smallerId-largerId" — segments already in the route
//   onSelect: function called when the player clicks a segment
//   disabled: boolean — disables all buttons (when time runs out)
export default function SegmentList({ segments, selectedKeys, onSelect, disabled }) {

  // Checks whether a segment is already selected by looking up its normalised key in the Set
  // Checked in both directions (A-B and B-A) in case the order does not match
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
              // Conditional CSS class: 'selected' adds the green background when already in the route
              className={`segment-btn ${isSelected(seg) ? 'selected' : ''}`}
              // Disabled if: time ran out OR segment is already selected
              disabled={disabled || isSelected(seg)}
              onClick={() => onSelect(seg)} // calls the parent component's function with the segment
            >
              {seg.stationAName} — {seg.stationBName} {/* shows the station names */}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
