// ============================================================================
// TrendChart — a line chart drawn by hand in SVG (no chart library needed).
// Takes a "series" of { date, pct, makes } points and plots the pct over time.
// ============================================================================
function TrendChart({ series }) {
  const W = 300, H = 140, pad = 24; // width, height, padding for axis labels
  if (series.length === 0) return null;

  // NOTE: convert a point's INDEX into an x pixel — spreads points evenly.
  const xs = (i) =>
    series.length === 1 ? W / 2 : pad + (i / (series.length - 1)) * (W - pad * 2);

  // NOTE: convert a 0–100 percentage into a y pixel. We flip it (H - ...)
  // because SVG y grows DOWNWARD, but a higher % should sit HIGHER on screen.
  const ys = (v) => H - pad - (v / 100) * (H - pad * 2);

  // NOTE: build the "x,y x,y x,y" string that <polyline> needs to draw the line.
  const pts = series.map((s, i) => `${xs(i)},${ys(s.pct)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="hl-chart">
      {/* gridlines + labels at 0/25/50/75/100% */}
      {[0, 25, 50, 75, 100].map((g) => (
        <g key={g}>
          <line x1={pad} y1={ys(g)} x2={W - pad} y2={ys(g)} className="hl-chart-grid" />
          <text x={pad - 4} y={ys(g) + 3} textAnchor="end" className="hl-chart-axis">{g}</text>
        </g>
      ))}
      {/* the trend line (only with 2+ points to connect) */}
      {series.length > 1 && <polyline points={pts} className="hl-chart-line" />}
      {/* a dot on each data point */}
      {series.map((s, i) => (
        <circle key={i} cx={xs(i)} cy={ys(s.pct)} r="3.5" className="hl-chart-dot" />
      ))}
    </svg>
  );
}

export default TrendChart;