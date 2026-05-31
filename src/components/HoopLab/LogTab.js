import { SPOTS, FOCUS_AREAS, DAILY_GOAL } from "./Constants";
import Court from "./Court";
import GoalRing from "./GoalRing";
// NOTE: this screen pulls in the shared data and the Court + GoalRing
// components. It receives everything it needs (current session data + the
// functions to change it) as PROPS from HoopLab.js — it holds no state itself.
// Keeping state in the parent and passing it down is called "lifting state up."

// ============================================================================
// StatMini — tiny stat display used in the session bar. Defined here because
// it's only used on this screen (co-locating small helpers with their only
// user keeps the project tidy).
// ============================================================================
function StatMini({ label, value, gold }) {
  return (
    <div className="hl-stat-mini">
      <div className="hl-stat-mini-label">{label}</div>
      <div className={"hl-stat-mini-value" + (gold ? " hl-gold" : "")}>{value}</div>
    </div>
  );
}

// ============================================================================
// LogTab — tap a spot, log makes/misses, tag the focus, save the session.
// ============================================================================
function LogTab({
  date, setDate, spotData, selectedSpot, setSelectedSpot, logShot, undoSpot,
  sessionMakes, sessionAtt, sessionPct, focus, toggleFocus, saveSession,
}) {
  // NOTE: find the full info for the selected spot, and its makes/attempts.
  const sel = SPOTS.find((s) => s.id === selectedSpot);
  const selData = selectedSpot ? spotData[selectedSpot] || { makes: 0, attempts: 0 } : null;
  // NOTE: progress toward the 200-make goal, capped at 100%.
  const goalPct = Math.min(100, Math.round((sessionMakes / DAILY_GOAL) * 100));

  return (
    <div>
      {/* daily goal ring + running totals */}
      <div className="hl-session-bar">
        <GoalRing pct={goalPct} makes={sessionMakes} />
        <div className="hl-session-stats">
          <StatMini label="Makes" value={sessionMakes} />
          <StatMini label="Attempts" value={sessionAtt} />
          <StatMini label="FG%" value={`${sessionPct}%`} gold />
        </div>
      </div>

      {/* session date */}
      <div className="hl-date-row">
        <label className="hl-date-label">Session Date</label>
        <input
          type="date"
          className="hl-date-input"
          value={date}                              // controlled input
          onChange={(e) => setDate(e.target.value)} // update state on change
        />
      </div>

      {/* the court — tapping a spot calls setSelectedSpot */}
      <div className="hl-court-wrap">
        <Court spotData={spotData} selectedSpot={selectedSpot} onSelect={setSelectedSpot} mode="log" />
      </div>

      {/* make/miss panel — only appears once a spot is selected */}
      {sel ? (
        <div className="hl-log-panel">
          <div className="hl-log-spot-name">
            {sel.label} {sel.three && <span className="hl-three-tag">3PT</span>}
          </div>
          <div className="hl-log-spot-stat">
            {selData.makes}/{selData.attempts}
            {selData.attempts > 0 && (
              <span className="hl-log-spot-pct">
                {" "}· {Math.round((selData.makes / selData.attempts) * 100)}%
              </span>
            )}
          </div>
          <div className="hl-shot-btns">
            <button className="hl-make-btn" onClick={() => logShot(true)}>✓ Make</button>
            <button className="hl-miss-btn" onClick={() => logShot(false)}>✕ Miss</button>
            <button className="hl-undo-btn" onClick={undoSpot}>↶</button>
          </div>
        </div>
      ) : (
        <div className="hl-empty-panel">👆 Tap a spot on the court to start logging</div>
      )}

      {/* trainer focus tags */}
      <div className="hl-focus-block">
        <div className="hl-focus-title">Today's Focus (trainer areas)</div>
        <div className="hl-focus-chips">
          {FOCUS_AREAS.map((f) => (
            <button
              key={f}
              className={"hl-focus-chip" + (focus.includes(f) ? " is-active" : "")}
              onClick={() => toggleFocus(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <button className="hl-save-btn" onClick={saveSession}>Save Session</button>
    </div>
  );
}

export default LogTab;