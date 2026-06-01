import { useState, useEffect } from "react";
import "./HoopLab.css";
import { todayISO } from "./Helpers";
import LogTab from "./LogTab";
import ProgressTab from "./ProgressTab";
import { getPlayers, createPlayer, getSessions, createSession } from "../../api";
// NOTE: these come from api.js — they talk to the Django backend (with the
// login token attached automatically). This replaces the old localStorage.

function HoopLab() {
  const [tab, setTab] = useState("log");

  // ---- backend data ----
  const [playerId, setPlayerId] = useState(null); // which player we're tracking
  const [sessions, setSessions] = useState([]);
  const [loadingData, setLoadingData] = useState(true); // true while first load runs
  const [errorMsg, setErrorMsg] = useState("");

  // ---- current in-progress session ----
  const [date, setDate] = useState(todayISO());
  const [spotData, setSpotData] = useState({});
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [focus, setFocus] = useState([]);

  // ---- on load: find (or create) the player, then load their sessions ----
  useEffect(() => {
    async function loadEverything() {
      try {
        // NOTE: ask the backend which players this account has.
        let players = await getPlayers();

        // NOTE: brand-new account with no player yet? create one using the
        // name we stashed at signup (fall back to "My Player").
        if (players.length === 0) {
          const name = localStorage.getItem("hooplab_playername") || "My Player";
          const newPlayer = await createPlayer(name);
          players = [newPlayer];
        }

        const id = players[0].id; // use the first player for now
        setPlayerId(id);

        // NOTE: load that player's saved sessions from the database.
        const loaded = await getSessions(id);
        setSessions(loaded);
      } catch (err) {
        setErrorMsg("Couldn't load your data. Is the backend running?");
      } finally {
        setLoadingData(false);
      }
    }
    loadEverything();
  }, []);

  // ---- live totals for the current session ----
  const sessionMakes = Object.values(spotData).reduce((s, d) => s + d.makes, 0);
  const sessionAtt = Object.values(spotData).reduce((s, d) => s + d.attempts, 0);
  const sessionPct = sessionAtt ? Math.round((sessionMakes / sessionAtt) * 100) : 0;

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

  // ---- while the first load runs, show a simple message ----
  if (loadingData) {
    return (
      <div className="hooplab">
        <header className="hl-header">
          <div className="hl-logo">🏀 HoopLab</div>
          <div className="hl-tagline">Loading…</div>
        </header>
      </div>
    );
  }

  return (
    <div className="hooplab">
      <header className="hl-header">
        <img
          alt="HoopLab"
          src="/HoopLab_Header_Logo.png"
          style={{ maxWidth: '320px', width: '100%', height: 'auto' }}
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
          logShot={logShot} undoSpot={undoSpot}
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