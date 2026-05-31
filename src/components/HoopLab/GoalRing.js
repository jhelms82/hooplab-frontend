import { DAILY_GOAL } from "./Constants";

// ============================================================================
// GoalRing — a circular progress ring drawn with SVG.
// Shows progress toward the daily 200-makes goal.
// ============================================================================
function GoalRing({ pct, makes }) {
  const r = 34;                 // radius
  const c = 2 * Math.PI * r;    // circumference (full ring length)
  const offset = c - (pct / 100) * c;
  // NOTE: stroke-dashoffset "hides" part of the ring. At 0% we hide all of it;
  // at 100% we hide none. Classic SVG progress-ring trick. This value is
  // dynamic (depends on pct), so it stays inline rather than in the CSS file.

  return (
    <div className="hl-ring-wrap">
      <svg width="90" height="90" viewBox="0 0 90 90">
        {/* faint full background ring */}
        <circle cx="45" cy="45" r={r} fill="none" strokeWidth="8" className="hl-ring-track" />
        {/* gold progress ring on top */}
        <circle
          cx="45" cy="45" r={r} fill="none" strokeWidth="8" strokeLinecap="round"
          className="hl-ring-fill"
          strokeDasharray={c} strokeDashoffset={offset}
          transform="rotate(-90 45 45)" // start at top, not the right edge
        />
        <text x="45" y="42" textAnchor="middle" fill="white" fontSize="18" fontWeight="900">{makes}</text>
        <text x="45" y="58" textAnchor="middle" fill="#ffd700" fontSize="9" fontWeight="700">/ {DAILY_GOAL}</text>
      </svg>
      <span className="hl-ring-label">Daily Goal</span>
    </div>
  );
}

export default GoalRing;