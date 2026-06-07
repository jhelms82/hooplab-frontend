import { useState, useEffect } from "react";
import "./HoopLab.css";
import { todayISO } from "./Helpers";
import LogTab from "./LogTab";
import ProgressTab from "./ProgressTab";
import { getPlayers, createPlayer, getSessions, createSession } from "../../api";
// NOTE: these come from api.js — they talk to the Django backend (with the
// login token attached automatically). This replaces the old localStorage.

// ============================================================================
// Spinner — a small spinning ring shown while the server cold-starts.
// NOTE: Render's FREE backend goes to sleep after ~15 min idle. The first
// visitor after that waits ~50s while it wakes. We inject a tiny @keyframes
// here so the spinner works without touching the CSS file.
// ============================================================================
function Spinner() {
  return (
    <>
      <style>{`@keyframes hl-spin { to { transform: rotate(360deg); } }`}</style>
      <div
        style={{
          width: 38, height: 38, margin: "18px auto",
          border: "4px solid rgba(255,255,255,0.18)",
          borderTopColor: "#fdcb6e",
          borderRadius: "50%",
          animation: "hl-spin 0.8s linear infinite",
        }}
      />
    </>
  );
}

function HoopLab() {
  const [tab, setTab] = useState("log");

  // ---- backend data ----
  const [playerId, setPlayerId] = useState(null); // which player we're tracking
  const [sessions, setSessions] = useState([]);
  const [loadingData, setLoadingData] = useState(true); // true while first load runs
  const [waking, setWaking] = useState(false);          // true once we detect a cold start
  const [errorMsg, setErrorMsg] = useState("");

  // ---- current in-progress session ----
  const [date, setDate] = useState(todayISO());
  const [spotData, setSpotData] = useState({});
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [focus, setFocus] = useState([]);

  // ---- on load: find (or create) the player, then load their sessions ----
  // NOTE: now with retry. If the very first request fails (server asleep),
  // we flip into "waking" mode and quietly retry a few times — the first
  // request wakes the server, a later retry succeeds. Only if EVERY retry
  // fails do we show a real error.
  useEffect(() => {
    let cancelled = false; // guard so we don't set state after unmount

    async function attemptLoad() {
      const MAX_ATTEMPTS = 6;
      const RETRY_DELAY = 5000; // 5s between tries (~25s of patience total)

      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
          // NOTE: ask the backend which players this account has.
          let players = await getPlayers();
          if (cancelled) return;

          // NOTE: brand-new account with no player yet? create one using the
          // name we stashed at signup (fall back to "My Player").
          if (players.length === 0) {
            const name = localStorage.getItem("hooplab_playername") || "My Player";
            const newPlayer = await createPlayer(name);
            players = [newPlayer];
          }

          const id = players[0].id; // use the first player for now
          const loaded = await getSessions(id);
          if (cancelled) return;

          // success — fill in the data and stop the loading screen
          setPlayerId(id);
          setSessions(loaded);
          setLoadingData(false);
          return;
        } catch (err) {
          if (cancelled) return;
          // a failure here usually means the server is still waking up
          setWaking(true);
          if (attempt < MAX_ATTEMPTS) {
            await new Promise((r) => setTimeout(r, RETRY_DELAY));
          } else {
            // out of retries — show a real (but friendly) error
            setErrorMsg("Server is taking longer than usual. Please refresh in a moment.");
            setLoadingData(false);
          }
        }
      }
    }

    attemptLoad();
    return () => {
      cancelled = true;
    };
  }, []);

  // ---- live totals for the current session ----
  const sessionMakes = Object.values(spotData).reduce((s, d) => s + d.makes, 0);
  const sessionAtt = Object.values(spotData).reduce((s, d) => s + d.attempts, 0);
  const sessionPct = sessionAtt ? Math.round((sessionMakes / sessionAtt) * 100) : 0;

  // ---- TAP MODE: log a single shot (one make or one miss) ----
  const logShot = (made) => {
    if (!selectedSpot) return;
    setSpotData((prev) => {
      const cur = prev[selectedSpot] || { makes: 0, attempts: 0 };
      return {
        ...prev,
        [selectedSpot]: {
          makes: cur.makes + (made ? 1 : 0),
          attempts: cur.attempts + 1,
        },
      };
    });
  };

  // ---- QUICK SET MODE: log a whole set at once (e.g. "made 8 of 10") ----
  // NOTE: this adds `made` makes and `total` attempts to the selected spot in
  // a SINGLE state update. It writes to the same spotData as logShot, so the
  // chart/goal/totals all treat a set exactly like that many individual taps.
  const logSet = (made, total) => {
    if (!selectedSpot) return;
    // NOTE: defensive guards — whole numbers, can't make more than you took.
    const m = Math.max(0, Math.floor(made));
    const t = Math.max(0, Math.floor(total));
    if (t === 0 || m > t) return;
    setSpotData((prev) => {
      const cur = prev[selectedSpot] || { makes: 0, attempts: 0 };
      return {
        ...prev,
        [selectedSpot]: {
          makes: cur.makes + m,
          attempts: cur.attempts + t,
        },
      };
    });
  };

  const undoSpot = () => {
    if (!selectedSpot) return;
    setSpotData((prev) => {
      const cur = prev[selectedSpot];
      if (!cur || cur.attempts === 0) return prev;
      return {
        ...prev,
        [selectedSpot]: { makes: Math.max(0, cur.makes - 1), attempts: cur.attempts - 1 },
      };
    });
  };

  const toggleFocus = (f) =>
    setFocus((cur) => (cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f]));

  // ---- save the session TO THE BACKEND ----
  const saveSession = async () => {
    if (sessionAtt === 0) {
      alert("Log at least one shot before saving.");
      return;
    }
    try {
      // NOTE: send the session + its shots to the database.
      await createSession(playerId, date, focus.join(", "), spotData);

      // NOTE: reload sessions from the backend so the Progress tab is fresh.
      const loaded = await getSessions(playerId);
      setSessions(loaded);

      // reset the form for the next session
      setSpotData({});
      setSelectedSpot(null);
      setFocus([]);
      setDate(todayISO());
      setTab("progress");
    } catch (err) {
      alert("Couldn't save the session. Check that the backend is running.");
    }
  };

  // ---- while the first load runs, show a loading / waking-up screen ----
  if (loadingData) {
    return (
      <div className="hooplab">
        <header className="hl-header">
          <div className="hl-logo">🏀 PureSwish</div>
          <div className="hl-tagline">
            {waking ? "Waking up the server… give it a few seconds 🏀" : "Loading…"}
          </div>
        </header>
        {waking && <Spinner />}
      </div>
    );
  }

  return (
    <div className="hooplab">
      <header className="hl-header">
        <img
          src="/PureSwish_Logo_Transparent.png"
          alt="PureSwish"
          style={{ maxWidth: '400px', width: '100%', height: 'auto', display: 'block', margin: '0 auto' }}
        />
      </header>
      {errorMsg && (
        <p style={{ textAlign: "center", color: "#ff7675" }}>{errorMsg}</p>
      )}

      <div className="hl-tabs">
        <button className={"hl-tab" + (tab === "log" ? " is-active" : "")} onClick={() => setTab("log")}>
          Log Session
        </button>
        <button className={"hl-tab" + (tab === "progress" ? " is-active" : "")} onClick={() => setTab("progress")}>
          Progress
        </button>
      </div>

      {tab === "log" ? (
        <LogTab
          date={date} setDate={setDate}
          spotData={spotData} selectedSpot={selectedSpot} setSelectedSpot={setSelectedSpot}
          logShot={logShot} logSet={logSet} undoSpot={undoSpot}
          sessionMakes={sessionMakes} sessionAtt={sessionAtt} sessionPct={sessionPct}
          focus={focus} toggleFocus={toggleFocus} saveSession={saveSession}
        />
      ) : (
        <ProgressTab sessions={sessions} />
      )}
    </div>
  );
}

export default HoopLab;