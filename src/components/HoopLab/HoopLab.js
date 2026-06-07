import { useState, useEffect, useRef } from "react";
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

// ============================================================================
// AddAthleteModal — a polished in-page dialog for adding a new athlete.
// Matches the app's dark + gold look. Handles Enter to submit, Escape /
// click-outside to close, autofocus, a busy state, and inline errors.
// All styling is injected here so no CSS file needs editing.
// ============================================================================
function AddAthleteModal({ open, onClose, onAdd }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const inputRef = useRef(null);

  // NOTE: when the modal opens, reset it and focus the input.
  useEffect(() => {
    if (open) {
      setName("");
      setErr("");
      setBusy(false);
      const t = setTimeout(() => inputRef.current && inputRef.current.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [open]);

  // NOTE: Escape key closes the modal.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) { setErr("Please enter a name."); return; }
    setBusy(true);
    setErr("");
    try {
      await onAdd(trimmed); // parent does the createPlayer; throws on failure
      onClose();
    } catch (e) {
      setErr("Couldn't add that athlete. Please try again.");
      setBusy(false);
    }
  };

  return (
    <div className="hl-modal-backdrop" onClick={onClose}>
      <style>{`
        .hl-modal-backdrop {
          position: fixed; inset: 0; z-index: 1000;
          display: flex; align-items: center; justify-content: center; padding: 20px;
          background: rgba(8, 12, 20, 0.72);
          backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
          animation: hl-modal-fade 0.18s ease-out;
        }
        @keyframes hl-modal-fade { from { opacity: 0; } to { opacity: 1; } }
        .hl-modal-card {
          width: 100%; max-width: 380px; box-sizing: border-box;
          background: linear-gradient(180deg, #1b2230 0%, #141a26 100%);
          border: 1px solid rgba(253, 203, 110, 0.25); border-radius: 18px;
          padding: 28px 24px 22px; text-align: center;
          box-shadow: 0 24px 60px rgba(0,0,0,0.55);
          animation: hl-modal-pop 0.22s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        @keyframes hl-modal-pop {
          from { opacity: 0; transform: translateY(12px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .hl-modal-emoji {
          font-size: 28px; width: 56px; height: 56px; margin: 0 auto 14px;
          display: flex; align-items: center; justify-content: center; border-radius: 50%;
          background: rgba(253, 203, 110, 0.12); border: 1px solid rgba(253, 203, 110, 0.3);
        }
        .hl-modal-title {
          margin: 0 0 4px; font-size: 1.35rem; font-weight: 800; color: #fff; letter-spacing: 0.2px;
        }
        .hl-modal-sub { margin: 0 0 18px; font-size: 0.9rem; color: rgba(255,255,255,0.55); }
        .hl-modal-input {
          width: 100%; box-sizing: border-box; padding: 13px 14px;
          font-size: 1rem; font-weight: 600; color: #fff; background: rgba(0,0,0,0.3);
          border: 1.5px solid rgba(255,255,255,0.15); border-radius: 11px; outline: none;
          transition: border-color 0.15s, box-shadow 0.15s; text-align: center;
        }
        .hl-modal-input::placeholder { color: rgba(255,255,255,0.35); font-weight: 500; }
        .hl-modal-input:focus {
          border-color: #fdcb6e; box-shadow: 0 0 0 3px rgba(253, 203, 110, 0.18);
        }
        .hl-modal-err { margin-top: 10px; font-size: 0.82rem; color: #ff7675; }
        .hl-modal-actions { display: flex; gap: 10px; margin-top: 20px; }
        .hl-modal-btn {
          flex: 1; padding: 12px; border-radius: 11px; font-weight: 700; font-size: 0.95rem;
          cursor: pointer; transition: transform 0.1s, filter 0.15s, background 0.15s;
        }
        .hl-modal-btn:active { transform: translateY(1px); }
        .hl-modal-btn:disabled { opacity: 0.6; cursor: default; }
        .hl-modal-cancel {
          background: transparent; color: rgba(255,255,255,0.7);
          border: 1.5px solid rgba(255,255,255,0.2);
        }
        .hl-modal-cancel:hover:not(:disabled) { background: rgba(255,255,255,0.06); }
        .hl-modal-add {
          background: linear-gradient(180deg, #fdcb6e, #f0b94d); color: #1a1207; border: none;
          box-shadow: 0 6px 16px rgba(253, 203, 110, 0.3);
        }
        .hl-modal-add:hover:not(:disabled) { filter: brightness(1.05); }
      `}</style>

      {/* stop clicks inside the card from closing the modal */}
      <div className="hl-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="hl-modal-emoji">🏀</div>
        <h3 className="hl-modal-title">Add Athlete</h3>
        <p className="hl-modal-sub">Track a new player's shooting workouts.</p>

        <input
          ref={inputRef}
          className="hl-modal-input"
          placeholder="Athlete's name"
          value={name}
          maxLength={40}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
        />
        {err && <div className="hl-modal-err">{err}</div>}

        <div className="hl-modal-actions">
          <button className="hl-modal-btn hl-modal-cancel" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className="hl-modal-btn hl-modal-add" onClick={submit} disabled={busy}>
            {busy ? "Adding…" : "Add Athlete"}
          </button>
        </div>
      </div>
    </div>
  );
}

function HoopLab() {
  const [tab, setTab] = useState("log");

  // ---- backend data ----
  const [players, setPlayers] = useState([]);      // ALL athletes on this account
  const [playerId, setPlayerId] = useState(null);  // the one we're viewing now
  const [sessions, setSessions] = useState([]);
  const [loadingData, setLoadingData] = useState(true); // true while first load runs
  const [waking, setWaking] = useState(false);          // true once we detect a cold start
  const [errorMsg, setErrorMsg] = useState("");
  const [modalOpen, setModalOpen] = useState(false);    // add-athlete dialog

  // ---- current in-progress session ----
  const [date, setDate] = useState(todayISO());
  const [spotData, setSpotData] = useState({});
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [focus, setFocus] = useState([]);

  // NOTE: clears whatever's being logged right now. Used when switching/adding
  // an athlete so one kid's in-progress shots never land on another.
  const clearInProgress = () => {
    setSpotData({});
    setSelectedSpot(null);
    setFocus([]);
    setDate(todayISO());
  };

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
          let list = await getPlayers();
          if (cancelled) return;

          // NOTE: brand-new account with no player yet? create one using the
          // name we stashed at signup (fall back to "My Player").
          if (list.length === 0) {
            const name = localStorage.getItem("hooplab_playername") || "My Player";
            const newPlayer = await createPlayer(name);
            list = [newPlayer];
          }

          const id = list[0].id; // start on the first athlete
          const loaded = await getSessions(id);
          if (cancelled) return;

          // success — fill in the data and stop the loading screen
          setPlayers(list);
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

  // ---- switch to a different athlete ----
  const selectPlayer = async (id) => {
    if (id === playerId) return;
    setPlayerId(id);
    clearInProgress();           // don't carry one athlete's shots to another
    setTab("log");
    try {
      const loaded = await getSessions(id);
      setSessions(loaded);
    } catch (err) {
      setErrorMsg("Couldn't load that athlete's sessions. Try refreshing.");
    }
  };

  // ---- add a new athlete (called by the modal; throws on failure) ----
  const handleAddAthlete = async (name) => {
    const newPlayer = await createPlayer(name);
    setPlayers((prev) => [...prev, newPlayer]);
    setPlayerId(newPlayer.id);
    setSessions([]);             // brand-new athlete has no sessions yet
    clearInProgress();
    setTab("log");
  };

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

  // ---- save the session TO THE BACKEND (for the CURRENT athlete) ----
  const saveSession = async () => {
    if (sessionAtt === 0) {
      alert("Log at least one shot before saving.");
      return;
    }
    try {
      // NOTE: send the session + its shots to the database.
      await createSession(playerId, date, focus.join(", "), spotData);

      // NOTE: reload THIS athlete's sessions so the Progress tab is fresh.
      const loaded = await getSessions(playerId);
      setSessions(loaded);

      // reset the form for the next session
      clearInProgress();
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

  // ---- inline styles for the athlete picker bar ----
  const athleteBar = {
    display: "flex", alignItems: "center", gap: "8px", justifyContent: "center",
    flexWrap: "wrap", maxWidth: 700, margin: "0 auto 6px", padding: "0 1rem",
  };
  const athleteLabel = { color: "rgba(255,255,255,0.7)", fontWeight: 600, fontSize: "0.9rem" };
  const athleteSelect = {
    padding: "8px 10px", borderRadius: 8, fontWeight: 700, fontSize: "0.95rem",
    background: "rgba(0,0,0,0.25)", color: "#fff",
    border: "1px solid rgba(255,255,255,0.25)",
  };
  const addAthleteBtn = {
    padding: "8px 12px", borderRadius: 8, fontWeight: 700, cursor: "pointer",
    border: "2px solid #fdcb6e", background: "rgba(253,203,110,0.15)", color: "#fdcb6e",
  };

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

      {/* athlete picker — switch between kids, or add a new one */}
      <div style={athleteBar}>
        <label style={athleteLabel}>Athlete:</label>
        <select
          style={athleteSelect}
          value={playerId || ""}
          onChange={(e) => selectPlayer(Number(e.target.value))}
        >
          {players.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <button style={addAthleteBtn} onClick={() => setModalOpen(true)}>+ Add Athlete</button>
      </div>

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

      {/* the polished add-athlete dialog */}
      <AddAthleteModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={handleAddAthlete}
      />
    </div>
  );
}

export default HoopLab;