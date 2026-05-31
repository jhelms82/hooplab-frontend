import { SPOTS } from "./Constants";
// NOTE: this component imports the shared SPOTS list and loops over it to draw
// every spot. It's used by BOTH LogTab and ProgressTab — the reason it lives in
// its own file instead of being copy-pasted into each.

// ============================================================================
// Court — one SVG half-court, two modes:
//   mode="log"  -> spots are tappable; the selected one is highlighted
//   mode="heat" -> spots are colored by shooting % (hot / warm / cold)
// ============================================================================
function Court({ spotData = {}, spotAgg = {}, selectedSpot, onSelect, mode }) {
  // NOTE: in heat mode, pick which CSS color-class a spot gets from its %.
  const heatClass = (id) => {
    const d = spotAgg[id];
    if (!d || d.attempts === 0) return "hl-spot--empty"; // no data → gray
    const pct = (d.makes / d.attempts) * 100;
    if (pct >= 50) return "hl-spot--hot";
    if (pct >= 35) return "hl-spot--warm";
    return "hl-spot--cold";
  };

  return (
    <svg viewBox="0 0 300 240" className="hl-court">
      {/* court surface + markings (static, styled via CSS classes) */}
      <rect x="6" y="6" width="288" height="228" rx="6" className="hl-court-surface" />
      <rect x="110" y="6" width="80" height="120" className="hl-court-line" />
      <circle cx="150" cy="126" r="34" className="hl-court-line" />
      <line x1="132" y1="26" x2="168" y2="26" className="hl-court-board" />
      <circle cx="150" cy="38" r="7" className="hl-court-hoop" />
      <path d="M 30 6 L 30 70 A 130 130 0 0 0 270 70 L 270 6" className="hl-court-line" />

      {/* draw every shooting spot by looping over the shared SPOTS data */}
      {SPOTS.map((sp) => {
        const isSel = sp.id === selectedSpot;

        // NOTE: build the circle's className based on the mode + state.
        let circleClass = "hl-spot ";
        if (mode === "heat") circleClass += "hl-spot--heat " + heatClass(sp.id);
        else circleClass += isSel ? "hl-spot--selected" : "hl-spot--idle";

        // NOTE: pick the right data source for this mode, then compute %.
        const d = mode === "heat" ? spotAgg[sp.id] : spotData[sp.id];
        const pct = d && d.attempts ? Math.round((d.makes / d.attempts) * 100) : null;

        // NOTE: on a bright heat circle, switch the text to dark so it's readable.
        const darkText = mode === "heat" && pct !== null;

        return (
          <g
            key={sp.id}
            onClick={onSelect ? () => onSelect(sp.id) : undefined}
            style={{ cursor: onSelect ? "pointer" : "default" }}
          >
            <circle cx={sp.x} cy={sp.y} r="15" className={circleClass} />
            <text x={sp.x} y={sp.y - 1} textAnchor="middle" className={"hl-spot-text" + (darkText ? " hl-spot-text--dark" : "")}>
              {sp.short}
            </text>
            {pct !== null && (
              <text x={sp.x} y={sp.y + 8} textAnchor="middle" className={"hl-spot-pct" + (darkText ? " hl-spot-pct--dark" : "")}>
                {pct}%
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export default Court;