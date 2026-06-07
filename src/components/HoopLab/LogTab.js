import { useState, useEffect } from "react";
import { SPOTS, FOCUS_AREAS, DAILY_GOAL } from "./Constants";
import Court from "./Court";
import GoalRing from "./GoalRing";
// NOTE: this screen pulls in the shared data and the Court + GoalRing
// components. It receives the session data + the functions to change it as
// PROPS from HoopLab.js. The ONLY state it holds itself is small UI state for
// the logging mode + the Quick Set input boxes (not session data).

// ============================================================================
// StatMini — tiny stat display used in the session bar.
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
//   Two logging modes once a spot is selected:
//     "tap" -> the original one-tap-per-shot Make / Miss buttons
//     "set" -> type "made X of Y" and add a whole set in one action
// ============================================================================
function LogTab({
  date, setDate, spotData, selectedSpot, setSelectedSpot, logShot, logSet, undoSpot,
  sessionMakes, sessionAtt, sessionPct, focus, toggleFocus, saveSession,
}) {
  // NOTE: small UI-only state. logMode persists as you move between spots;
  // the typed Quick Set values clear whenever you switch spots (below).
  const [logMode, setLogMode] = useState("tap"); // "tap" | "set"
  const [setMade, setSetMade] = useState("");
  const [setTotal, setSetTotal] = useState("");
  const [setError, setSetError] = useState("");

  // NOTE: when the selected spot changes, clear the Quick Set inputs so you
  // can't accidentally add a half-typed set to the wrong spot.
  useEffect(() => {
    setSetMade("");
    setSetTotal("");
    setSetError("");
  }, [selectedSpot]);

  // NOTE: find the full info for the selected spot, and its makes/attempts.
  const sel = SPOTS.find((s) => s.id === selectedSpot);
  const selData = selectedSpot ? spotData[selectedSpot] || { makes: 0, attempts: 0 } : null;
  // NOTE: progress toward the 200-make goal, capped at 100%.
  const goalPct = Math.min(100, Math.round((sessionMakes / DAILY_GOAL) * 100));

  // NOTE: validate + add a whole set, then clear the inputs for the next one.
  const handleAddSet = () => {
    const made = parseInt(setMade, 10);
    const total = parseInt(setTotal, 10);
    if (isNaN(total) || total <= 0) {
      setSetError("Enter how many shots were in the set.");
      return;
    }
    if (isNaN(made) || made < 0) {
      setSetError("Enter how many went in.");
      return;
    }
    if (made > total) {
      setSetError("Makes can't be more than the total.");
      return;
    }
    logSet(made, total);
    setSetMade("");
    setSetTotal("");
    setSetError("");
  };

  // ---- inline styles for the new mode toggle + Quick Set inputs ----
  // (kept inline so no CSS file needs changing)
  const toggleWrap = {
    display: "flex", gap: "6px", marginBottom: "12px", justifyContent: "center",
  };
  const toggleBtn = (active) => ({
    flex: 1, padding: "8px 10px", borderRadius: "8px", cursor: "pointer",
    fontWeight: 600, fontSize: "0.85rem",
    border: active ? "2px solid #fdcb6e" : "1px solid rgba(255,255,255,0.2)",
    background: active ? "rgba(253,203,110,0.15)" : "transparent",
    color: active ? "#fdcb6e" : "rgba(255,255,255,0.7)",
  });
  const setRow = {
    display: "flex", gap: "8px", alignItems: "center", justifyContent: "center",
    flexWrap: "wrap",
  };
  const numInput = {
    width: "64px", padding: "10px", borderRadius: "8px", textAlign: "center",
    fontSize: "1.1rem", fontWeight: 700,
    border: "1px solid rgba(255,255,255,0.25)", background: "rgba(0,0,0,0.25)",
    color: "#fff",
  };
  const ofText = { color: "rgba(255,255,255,0.7)", fontWeight: 600 };

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

          {/* mode toggle: Tap vs Quick Set */}
          <div style={toggleWrap}>
            <button style={toggleBtn(logMode === "tap")} onClick={() => setLogMode("tap")}>
              Tap
            </button>
            <button style={toggleBtn(logMode === "set")} onClick={() => setLogMode("set")}>
              Quick Set
            </button>
          </div>

          {logMode === "tap" ? (
            // ---- TAP MODE: original one-tap-per-shot buttons ----
            <div className="hl-shot-btns">
              <button className="hl-make-btn" onClick={() => logShot(true)}>✓ Make</button>
              <button className="hl-miss-btn" onClick={() => logShot(false)}>✕ Miss</button>
              <button className="hl-undo-btn" onClick={undoSpot}>↶</button>
            </div>
          ) : (
            // ---- QUICK SET MODE: "made X of Y" + Add ----
            <div>
              <div style={setRow}>
                <span style={ofText}>Made</span>
                <input
                  type="number" inputMode="numeric" min="0"
                  style={numInput} value={setMade}
                  onChange={(e) => setSetMade(e.target.value)}
                  placeholder="0"
                />
                <span style={ofText}>of</span>
                <input
                  type="number" inputMode="numeric" min="0"
                  style={numInput} value={setTotal}
                  onChange={(e) => setSetTotal(e.target.value)}
                  placeholder="0"
                />
                <button className="hl-make-btn" onClick={handleAddSet}>+ Add</button>
                <button className="hl-undo-btn" onClick={undoSpot}>↶</button>
              </div>
              {setError && (
                <div style={{ color: "#ff7675", fontSize: "0.8rem", textAlign: "center", marginTop: "8px" }}>
                  {setError}
                </div>
              )}
            </div>
          )}
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