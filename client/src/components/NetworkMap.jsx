// ─── NetworkMap — SVG map of the metro network ───────────────────────────────
// Draws a visual map of the network using SVG (vector graphics in HTML).
// Used in two contexts:
//   - Setup: showLines=true  -> shows stations + coloured lines
//   - Planning: showLines=false -> shows only stations (without revealing the lines)

export default function NetworkMap({ stations, lines, lineStations, showLines = true }) {
  if (!stations?.length) return null;

  const stationById = Object.fromEntries(stations.map((s) => [s.id, s]));

  const linePaths =
    showLines && lines && lineStations
      ? lines.map((line) => {
          const ordered = lineStations
            .filter((ls) => ls.lineId === line.id)
            .sort((a, b) => a.position - b.position)
            .map((ls) => stationById[ls.stationId])
            .filter(Boolean);

          if (ordered.length < 2) return null;

          // "M x y" = MoveTo, "L x y" = LineTo
          const d = ordered
            .map((st, i) => `${i === 0 ? 'M' : 'L'} ${st.x} ${st.y}`)
            .join(' ');

          return { id: line.id, color: line.color, d, name: line.name };
        })
      : [];

  return (
    <div className="map-panel">
      <svg viewBox="0 0 900 450" className="network-map" role="img" aria-label="Network map">
        {linePaths.map(
          (path) =>
            path && (
              <path
                key={path.id}
                d={path.d}
                stroke={path.color}
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
                opacity="0.85"
              />
            )
        )}

        {stations.map((st) => (
          <g key={st.id}>
            <circle
              cx={st.x}
              cy={st.y}
              r={st.isInterchange ? 14 : 10}
              className={st.isInterchange ? 'station interchange' : 'station'}
            />
            <text x={st.x} y={st.y - 18} textAnchor="middle" className="station-label">
              {st.name}
            </text>
          </g>
        ))}
      </svg>

      {showLines && lines && (
        <ul className="line-legend">
          {lines.map((line) => (
            <li key={line.id}>
              <span className="legend-swatch" style={{ background: line.color }} />
              {line.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}