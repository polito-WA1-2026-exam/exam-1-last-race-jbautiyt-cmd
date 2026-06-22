// ─── NetworkMap — SVG map of the metro network ───────────────────────────────
// Draws a visual map of the network using SVG (vector graphics in HTML).
// Used in two contexts:
//   - Setup: showLines=true → shows stations + coloured lines
//   - Planning: showLines=false → shows only stations (without revealing the lines)

// Props:
//   stations: array of { id, name, x, y, isInterchange }
//   lines: array of { id, name, color } (optional, only needed when showLines=true)
//   lineStations: array of { lineId, stationId, position } (defines station order per line)
//   showLines: boolean — whether to show the coloured lines or not
export default function NetworkMap({ stations, lines, lineStations, showLines = true }) {
  // If there are no stations yet (data loading), render nothing
  if (!stations?.length) return null;

  // Create an id→station map for fast coordinate lookups
  const stationById = Object.fromEntries(stations.map((s) => [s.id, s]));

  // Calculate the SVG paths for each line (only if showLines=true)
  const linePaths =
    showLines && lines && lineStations
      ? lines.map((line) => {
          // For each line, sort its stations by position and get their coordinates
          const ordered = lineStations
            .filter((ls) => ls.lineId === line.id)         // only stations on this line
            .sort((a, b) => a.position - b.position)       // sort by position on the line
            .map((ls) => stationById[ls.stationId])        // get the station object with coordinates
            .filter(Boolean);                               // remove possible nulls

          if (ordered.length < 2) return null; // a line with fewer than 2 stations cannot be drawn

          // Build the SVG path "d" attribute:
          // "M x y" = MoveTo (moves cursor without drawing)
          // "L x y" = LineTo (draws a line to that point)
          const d = ordered
            .map((st, i) => `${i === 0 ? 'M' : 'L'} ${st.x} ${st.y}`)
            .join(' '); // joins all commands into one string: "M 120 80 L 280 80 L 440 80..."

          return { id: line.id, color: line.color, d, name: line.name };
        })
      : []; // if showLines=false, no paths are calculated

  return (
    <div className="map-panel">
      {/* SVG viewBox="0 0 900 450": the internal coordinate system of the map */}
      <svg viewBox="0 0 900 450" className="network-map" role="img" aria-label="Network map">

        {/* Draw the coloured lines beneath the stations */}
        {linePaths.map(
          (path) =>
            path && (
              <path
                key={path.id}
                d={path.d}           // the SVG path calculated above
                stroke={path.color}  // line colour (hexadecimal from the server)
                strokeWidth="6"      // thickness in SVG pixels
                fill="none"          // no fill (it is a line, not a shape)
                strokeLinecap="round" // rounded ends
                opacity="0.85"       // slightly transparent to see overlaps
              />
            )
        )}

        {/* Draw each station as a circle with its name */}
        {stations.map((st) => (
          <g key={st.id}> {/* <g> groups the circle and text so they move together */}
            <circle
              cx={st.x}  // X coordinate of the circle centre
              cy={st.y}  // Y coordinate of the circle centre
              r={st.isInterchange ? 14 : 10} // interchange stations are larger
              className={st.isInterchange ? 'station interchange' : 'station'} // different CSS for interchanges
            />
            <text
              x={st.x}        // horizontally centred above the circle
              y={st.y - 18}   // 18 pixels above the circle
              textAnchor="middle"   // anchors the text at its centre point
              className="station-label"
            >
              {st.name}
            </text>
          </g>
        ))}
      </svg>

      {/* Line legend (only when showLines=true) */}
      {showLines && lines && (
        <ul className="line-legend">
          {lines.map((line) => (
            <li key={line.id}>
              <span className="legend-swatch" style={{ background: line.color }} /> {/* colour square */}
              {line.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
