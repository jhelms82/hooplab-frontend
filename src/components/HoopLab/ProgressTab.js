import { SPOTS } from "./Constants";
import { sumSpots, fmtDate, currentStreak } from "./Helpers";
import Court from "./Court";
import TrendChart from "./TrendChart";
// NOTE: this screen takes the full list of saved sessions as a prop and does
// all the "career" math (totals, streak, per-spot aggregates) right here, then
// hands the results to Court and TrendChart to draw.

// ============================================================================
// Small display components used only on this screen.
// ============================================================================
function BigStat({ label, value, gold }) {
  return (
    <div className={"hl-big-stat" + (gold ? " is-gold" : "")}>
      <div className="hl-big-stat-value">{value}</div>
      <div className="hl-big-stat-label">{label}</div>
    </div>
  );
}
function Legend({ color, text }) {
  return (
    <span className="hl-legend-item">
      <span className="hl-legend-dot" style={{ background: color }} /> {text}
    </span>
  );
}

// ============================================================================
// ProgressTab — the payoff screen.
// ============================================================================
function ProgressTab({ sessions }) {
  // NOTE: nothing logged yet → friendly empty state, and stop here.
  if (sessions.length === 0) {
    return (
      <div className="hl-empty-big">
        No sessions logged yet.<br />
        Log your first one to see progress, streaks, and your shot chart.
      </div>
    );
  }

  // ---- career totals across every session ----
  const totalMakes = sessions.reduce((s, ses) => s + sumSpots(ses, "makes"), 0);
  const totalAtt = sessions.reduce((s, ses) => s + sumSpots(ses, "attempts"), 0);
  const careerPct = totalAtt ? Math.round((totalMakes / totalAtt) * 100) : 0;
  const streak = currentStreak(sessions);

  // ---- one FG% point per session, oldest → newest, for the trend line ----
  const series = sessions
    .slice()
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((ses) => {
      const m = sumSpots(ses, "makes");
      const a = sumSpots(ses, "attempts");
      return { date: ses.date, pct: a ? Math.round((m / a) * 100) : 0, makes: m };
    });

  // ---- combine makes/attempts PER SPOT across all sessions (for hot/cold) ----
  const spotAgg = {};
  SPOTS.forEach((sp) => (spotAgg[sp.id] = { makes: 0, attempts: 0 }));
  sessions.forEach((ses) =>
    Object.entries(ses.spots).forEach(([id, d]) => {
      if (!spotAgg[id]) spotAgg[id] = { makes: 0, attempts: 0 };
      spotAgg[id].makes += d.makes;
      spotAgg[id].attempts += d.attempts;
    })
  );

  return (
    <div>
      {/* headline stats */}
      <div className="hl-stat-grid">
        <BigStat label="🔥 Streak" value={`${streak}d`} />
        <BigStat label="Career FG%" value={`${careerPct}%`} gold />
        <BigStat label="Total Makes" value={totalMakes.toLocaleString()} />
        <BigStat label="Sessions" value={sessions.length} />
      </div>

      {/* FG% trend */}
      <div className="hl-chart-panel">
        <h3 className="hl-panel-title">FG% Trend</h3>
        <TrendChart series={series} />
      </div>

      {/* hot/cold court */}
      <div className="hl-chart-panel">
        <h3 className="hl-panel-title">Shot Chart — Hot &amp; Cold Zones</h3>
        <div className="hl-court-wrap">
          <Court spotAgg={spotAgg} mode="heat" />
        </div>
        <div className="hl-legend">
          <Legend color="#00b894" text="≥ 50%" />
          <Legend color="#fdcb6e" text="35–49%" />
          <Legend color="#d63031" text="< 35%" />
          <Legend color="rgba(255,255,255,0.15)" text="No data" />
        </div>
      </div>

      {/* recent sessions */}
      <div className="hl-chart-panel">
        <h3 className="hl-panel-title">Recent Sessions</h3>
        {sessions
          .slice()
          .reverse()
          .slice(0, 8)
          .map((ses) => {
            const m = sumSpots(ses, "makes");
            const a = sumSpots(ses, "attempts");
            const pct = a ? Math.round((m / a) * 100) : 0;
            return (
              <div key={ses.id} className="hl-session-row">
                <span className="hl-session-date">{fmtDate(ses.date)}</span>
                <span className="hl-session-line">{m}/{a}</span>
                <span className="hl-session-pct">{pct}%</span>
                {ses.focus?.length > 0 && (
                  <span className="hl-session-focus">{ses.focus.join(", ")}</span>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}

export default ProgressTab;