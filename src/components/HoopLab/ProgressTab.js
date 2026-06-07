import { SPOTS, CATEGORIES } from "./Constants";
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

  // ---- roll the per-spot totals up into shot-type CATEGORIES ----
  // NOTE: each spot knows its own category (see Constants.js), so we just add
  // each spot's makes/attempts into its category bucket. Pure calculation on
  // data we already have — no new tracking, no database change.
  const catAgg = {};
  CATEGORIES.forEach((c) => (catAgg[c] = { makes: 0, attempts: 0 }));
  SPOTS.forEach((sp) => {
    const a = spotAgg[sp.id];
    if (!a || !catAgg[sp.category]) return;
    catAgg[sp.category].makes += a.makes;
    catAgg[sp.category].attempts += a.attempts;
  });

  return (
    <div>
      {/* headline stats */}
      <div className="hl-stat-grid">
        <BigStat label="🔥 Streak" value={`${streak}d`} />
        <BigStat label="Career FG%" value={`${careerPct}%`} gold />
        <BigStat label="Total Makes" value={totalMakes.toLocaleString()} />
        <BigStat label="Sessions" value={sessions.length} />
      </div>

      {/* shot-type breakdown */}
      <div className="hl-chart-panel">
        <h3 className="hl-panel-title">Breakdown by Shot Type</h3>
        <div className="hl-stat-grid">
          {CATEGORIES.map((c) => {
            const { makes, attempts } = catAgg[c];
            const pct = attempts ? Math.round((makes / attempts) * 100) : 0;
            return (
              <BigStat
                key={c}
                label={attempts ? `${c} · ${makes}/${attempts}` : c}
                value={attempts ? `${pct}%` : "—"}
              />
            );
          })}
        </div>
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