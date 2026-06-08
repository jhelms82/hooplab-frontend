import { useState, useEffect, useRef } from "react";
import "./HoopLab.css";
import { todayISO, sumSpots, currentStreak } from "./Helpers";
import LogTab from "./LogTab";
import ProgressTab from "./ProgressTab";
import {
  getPlayers, createPlayer, updatePlayer, deletePlayer,
  getSessions, createSession,
} from "../../api";
// NOTE: these come from api.js — they talk to the Django backend (with the
// login token attached automatically).

// ============================================================================
// CUSTOM_CSS — all the styling for the top bar, account menu, and modals,
// injected once. Uses the app's gold (#ffd700) so everything matches.
// ============================================================================
const CUSTOM_CSS = `
  .ps-topbar {
    position: sticky; top: 0; z-index: 500;
    display: flex; justify-content: flex-end; align-items: center;
    margin: -1rem -1rem 0.5rem;
    padding: 11px 16px;
    background: rgba(10, 22, 28, 0.72);
    backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }
  .ps-topbar--split { justify-content: space-between; }
  .ps-topbar--bare {
    background: transparent; border-bottom: none;
    backdrop-filter: none; -webkit-backdrop-filter: none;
  }
  .ps-topbar-logo { height: 42px; width: auto; display: block; }
  .ps-greeting { text-align: left; }
  .ps-greeting-label { font-size: 0.62rem; color: rgba(255,255,255,0.45); text-transform: uppercase; letter-spacing: 1.5px; }
  .ps-greeting-date { font-size: 0.92rem; color: #fff; font-weight: 700; margin-top: 2px; }
  .ps-statstrip { display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; margin-top: 12px; }
  .ps-stat {
    display: flex; flex-direction: column; align-items: center;
    background: rgba(0,0,0,0.3); border: 1px solid rgba(255,215,0,0.22);
    border-radius: 12px; padding: 8px 18px; min-width: 80px;
  }
  .ps-stat-val { font-size: 1.35rem; font-weight: 900; font-family: "Impact", sans-serif; color: #fff; line-height: 1.05; }
  .ps-stat-gold { color: #ffd700; }
  .ps-stat-unit { font-size: 0.8rem; }
  .ps-stat-lbl { font-size: 0.62rem; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
  .ps-acct { position: relative; }
  .ps-acct-btn {
    display: flex; align-items: center; gap: 9px;
    padding: 6px 14px 6px 6px; border-radius: 999px; cursor: pointer;
    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12);
    color: #fff; font-weight: 700; font-size: 0.9rem;
    transition: background 0.15s, border-color 0.15s;
  }
  .ps-acct-btn:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,215,0,0.45); }
  .ps-acct-avatar {
    width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    background: linear-gradient(135deg, #ffed4e, #ffd700); color: #1a472a;
    font-weight: 800; font-size: 0.9rem;
  }
  .ps-acct-name { max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .ps-acct-chev { color: rgba(255,255,255,0.55); font-size: 0.7rem; transition: transform 0.18s; }
  .ps-acct-chev.is-open { transform: rotate(180deg); }

  .ps-menu {
    position: absolute; top: calc(100% + 8px); right: 0; min-width: 252px;
    background: linear-gradient(180deg, #14323f, #0e2530);
    border: 1px solid rgba(255,255,255,0.1); border-radius: 14px;
    box-shadow: 0 18px 44px rgba(0,0,0,0.5);
    padding: 8px; z-index: 600;
    animation: ps-menu-pop 0.16s ease-out;
  }
  @keyframes ps-menu-pop { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
  .ps-menu-label {
    font-size: 0.66rem; letter-spacing: 0.09em; text-transform: uppercase;
    color: rgba(255,255,255,0.4); padding: 8px 10px 6px; font-weight: 700;
  }
  .ps-menu-row { display: flex; align-items: center; gap: 2px; border-radius: 9px; }
  .ps-menu-row:hover { background: rgba(255,255,255,0.05); }
  .ps-menu-row.is-current { background: rgba(255,215,0,0.1); }
  .ps-menu-switch {
    flex: 1; display: flex; align-items: center; gap: 10px; min-width: 0;
    padding: 9px 8px 9px 10px; border: none; background: transparent;
    color: #fff; font-weight: 600; font-size: 0.92rem; cursor: pointer; text-align: left;
    border-radius: 9px;
  }
  .ps-menu-dot {
    width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    background: rgba(255,255,255,0.1); color: #fff; font-weight: 800; font-size: 0.8rem;
  }
  .ps-menu-dot--add { background: rgba(255,215,0,0.18); color: #ffd700; }
  .ps-menu-text { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .ps-menu-check { color: #ffd700; font-weight: 800; flex-shrink: 0; }
  .ps-menu-icon {
    width: 30px; height: 30px; flex-shrink: 0; border-radius: 8px; border: none;
    background: transparent; color: rgba(255,255,255,0.5); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.12s, color 0.12s;
  }
  .ps-menu-icon:hover { background: rgba(255,255,255,0.1); color: #fff; }
  .ps-menu-icon--del:hover { background: rgba(255,118,117,0.15); color: #ff7675; }
  .ps-menu-item {
    width: 100%; display: flex; align-items: center; gap: 10px;
    padding: 9px 10px; border-radius: 9px; border: none; background: transparent;
    color: #fff; font-weight: 600; font-size: 0.92rem; cursor: pointer; text-align: left;
    transition: background 0.12s;
  }
  .ps-menu-item:hover { background: rgba(255,255,255,0.07); }
  .ps-menu-add { color: #ffd700; }
  .ps-menu-divider { height: 1px; background: rgba(255,255,255,0.08); margin: 6px 4px; }
  .ps-menu-logout { color: rgba(255,255,255,0.75); }
  .ps-menu-logout:hover { background: rgba(255,118,117,0.12); color: #ff7675; }

  .hl-modal-backdrop {
    position: fixed; inset: 0; z-index: 1000;
    display: flex; align-items: center; justify-content: center; padding: 20px;
    background: rgba(6, 14, 18, 0.72);
    backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
    animation: hl-modal-fade 0.18s ease-out;
  }
  @keyframes hl-modal-fade { from { opacity: 0; } to { opacity: 1; } }
  .hl-modal-card {
    width: 100%; max-width: 380px; box-sizing: border-box;
    background: linear-gradient(180deg, #14323f 0%, #0e2530 100%);
    border: 1px solid rgba(255, 215, 0, 0.25); border-radius: 18px;
    padding: 28px 24px 22px; text-align: center;
    box-shadow: 0 24px 60px rgba(0,0,0,0.55);
    animation: hl-modal-pop 0.22s cubic-bezier(0.2, 0.8, 0.2, 1);
  }
  @keyframes hl-modal-pop {
    from { opacity: 0; transform: translateY(12px) scale(0.96); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  .hl-modal-emoji {
    font-size: 26px; width: 56px; height: 56px; margin: 0 auto 14px;
    display: flex; align-items: center; justify-content: center; border-radius: 50%;
    background: rgba(255, 215, 0, 0.12); border: 1px solid rgba(255, 215, 0, 0.3);
  }
  .hl-modal-title { margin: 0 0 4px; font-size: 1.3rem; font-weight: 800; color: #fff; }
  .hl-modal-sub { margin: 0 0 18px; font-size: 0.9rem; color: rgba(255,255,255,0.55); line-height: 1.5; }
  .hl-modal-input {
    width: 100%; box-sizing: border-box; padding: 13px 14px;
    font-size: 1rem; font-weight: 600; color: #fff; background: rgba(0,0,0,0.3);
    border: 1.5px solid rgba(255,255,255,0.15); border-radius: 11px; outline: none;
    transition: border-color 0.15s, box-shadow 0.15s; text-align: center;
  }
  .hl-modal-input::placeholder { color: rgba(255,255,255,0.35); font-weight: 500; }
  .hl-modal-input:focus { border-color: #ffd700; box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.18); }
  .hl-modal-err { margin-top: 10px; font-size: 0.82rem; color: #ff7675; }
  .hl-modal-actions { display: flex; gap: 10px; margin-top: 20px; }
  .hl-modal-btn {
    flex: 1; padding: 12px; border-radius: 11px; font-weight: 700; font-size: 0.95rem;
    cursor: pointer; transition: transform 0.1s, filter 0.15s, background 0.15s;
  }
  .hl-modal-btn:active { transform: translateY(1px); }
  .hl-modal-btn:disabled { opacity: 0.6; cursor: default; }
  .hl-modal-cancel {
    background: transparent; color: rgba(255,255,255,0.7); border: 1.5px solid rgba(255,255,255,0.2);
  }
  .hl-modal-cancel:hover:not(:disabled) { background: rgba(255,255,255,0.06); }
  .hl-modal-add {
    background: linear-gradient(180deg, #ffed4e, #ffd700); color: #1a472a; border: none;
    box-shadow: 0 6px 16px rgba(255, 215, 0, 0.3);
  }
  .hl-modal-add:hover:not(:disabled) { filter: brightness(1.05); }
  .hl-modal-delete {
    background: linear-gradient(180deg, #ff7b7a, #e74c3c); color: #fff; border: none;
    box-shadow: 0 6px 16px rgba(231, 76, 60, 0.3);
  }
  .hl-modal-delete:hover:not(:disabled) { filter: brightness(1.05); }
`;

// small inline icons (inherit text color)
const PencilIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);
const TrashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
  </svg>
);

// ============================================================================
// Spinner — shown while the server cold-starts.
// ============================================================================
function Spinner() {
  return (
    <>
      <style>{`@keyframes hl-spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{
        width: 38, height: 38, margin: "18px auto",
        border: "4px solid rgba(255,255,255,0.18)", borderTopColor: "#ffd700",
        borderRadius: "50%", animation: "hl-spin 0.8s linear infinite",
      }} />
    </>
  );
}

// ============================================================================
// AccountMenu — top-right pill + dropdown: switch / rename / delete athletes,
// add a new one, and log out.
// ============================================================================
function AccountMenu({ players, playerId, onSelect, onAdd, onEdit, onDelete, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = players.find((p) => p.id === playerId);
  const initial = current ? current.name.charAt(0).toUpperCase() : "?";

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="ps-acct" ref={ref}>
      <button className="ps-acct-btn" onClick={() => setOpen((o) => !o)}>
        <span className="ps-acct-avatar">{initial}</span>
        <span className="ps-acct-name">{current ? current.name : "Athlete"}</span>
        <span className={"ps-acct-chev" + (open ? " is-open" : "")}>▾</span>
      </button>

      {open && (
        <div className="ps-menu">
          <div className="ps-menu-label">Switch Athlete</div>
          {players.map((p) => (
            <div key={p.id} className={"ps-menu-row" + (p.id === playerId ? " is-current" : "")}>
              <button className="ps-menu-switch" onClick={() => { onSelect(p.id); setOpen(false); }}>
                <span className="ps-menu-dot">{p.name.charAt(0).toUpperCase()}</span>
                <span className="ps-menu-text">{p.name}</span>
                {p.id === playerId && <span className="ps-menu-check">✓</span>}
              </button>
              <button className="ps-menu-icon" title="Rename"
                onClick={() => { onEdit(p); setOpen(false); }}>
                <PencilIcon />
              </button>
              {players.length > 1 && (
                <button className="ps-menu-icon ps-menu-icon--del" title="Delete"
                  onClick={() => { onDelete(p); setOpen(false); }}>
                  <TrashIcon />
                </button>
              )}
            </div>
          ))}

          <button className="ps-menu-item ps-menu-add" onClick={() => { onAdd(); setOpen(false); }}>
            <span className="ps-menu-dot ps-menu-dot--add">+</span>
            <span className="ps-menu-text">Add Athlete</span>
          </button>

          <div className="ps-menu-divider" />

          <button className="ps-menu-item ps-menu-logout" onClick={() => { setOpen(false); onLogout(); }}>
            <span className="ps-menu-dot">⎋</span>
            <span className="ps-menu-text">Log Out</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// AthleteModal — add OR rename an athlete (mode = "add" | "edit").
// ============================================================================
function AthleteModal({ open, mode, initialName, onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const inputRef = useRef(null);
  const isEdit = mode === "edit";

  useEffect(() => {
    if (open) {
      setName(initialName || "");
      setErr(""); setBusy(false);
      const t = setTimeout(() => inputRef.current && inputRef.current.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [open, initialName]);

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
    setBusy(true); setErr("");
    try {
      await onSubmit(trimmed);
      onClose();
    } catch (e) {
      setErr(isEdit ? "Couldn't save changes. Please try again." : "Couldn't add that athlete. Please try again.");
      setBusy(false);
    }
  };

  return (
    <div className="hl-modal-backdrop" onClick={onClose}>
      <div className="hl-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="hl-modal-emoji">🏀</div>
        <h3 className="hl-modal-title">{isEdit ? "Rename Athlete" : "Add Athlete"}</h3>
        <p className="hl-modal-sub">
          {isEdit ? "Update this athlete's name." : "Track a new player's shooting workouts."}
        </p>

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
            {busy ? (isEdit ? "Saving…" : "Adding…") : (isEdit ? "Save" : "Add Athlete")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ConfirmDeleteModal — confirms before permanently deleting an athlete.
// ============================================================================
function ConfirmDeleteModal({ open, name, onClose, onConfirm }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => { if (open) { setBusy(false); setErr(""); } }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const confirm = async () => {
    setBusy(true); setErr("");
    try {
      await onConfirm();
      onClose();
    } catch (e) {
      setErr("Couldn't delete. Please try again.");
      setBusy(false);
    }
  };

  return (
    <div className="hl-modal-backdrop" onClick={onClose}>
      <div className="hl-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="hl-modal-emoji"
          style={{ background: "rgba(255,118,117,0.12)", borderColor: "rgba(255,118,117,0.35)" }}>
          🗑
        </div>
        <h3 className="hl-modal-title">Delete {name}?</h3>
        <p className="hl-modal-sub">
          This removes this athlete and all of their saved sessions. This can't be undone.
        </p>
        {err && <div className="hl-modal-err">{err}</div>}

        <div className="hl-modal-actions">
          <button className="hl-modal-btn hl-modal-cancel" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className="hl-modal-btn hl-modal-delete" onClick={confirm} disabled={busy}>
            {busy ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

function HoopLab({ onLogout }) {
  const [tab, setTab] = useState("log");

  // ---- backend data ----
  const [players, setPlayers] = useState([]);
  const [playerId, setPlayerId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [waking, setWaking] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // ---- athlete dialogs ----
  const [athleteModalOpen, setAthleteModalOpen] = useState(false);
  const [athleteModalMode, setAthleteModalMode] = useState("add"); // "add" | "edit"
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // ---- current in-progress session ----
  const [date, setDate] = useState(todayISO());
  const [spotData, setSpotData] = useState({});
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [focus, setFocus] = useState([]);

  const clearInProgress = () => {
    setSpotData({});
    setSelectedSpot(null);
    setFocus([]);
    setDate(todayISO());
  };

  // ---- on load: find (or create) the player, then load their sessions ----
  useEffect(() => {
    let cancelled = false;

    async function attemptLoad() {
      const MAX_ATTEMPTS = 6;
      const RETRY_DELAY = 5000;

      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
          let list = await getPlayers();
          if (cancelled) return;

          if (list.length === 0) {
            const name = localStorage.getItem("hooplab_playername") || "My Player";
            const newPlayer = await createPlayer(name);
            list = [newPlayer];
          }

          const id = list[0].id;
          const loaded = await getSessions(id);
          if (cancelled) return;

          setPlayers(list);
          setPlayerId(id);
          setSessions(loaded);
          setLoadingData(false);
          return;
        } catch (err) {
          if (cancelled) return;
          setWaking(true);
          if (attempt < MAX_ATTEMPTS) {
            await new Promise((r) => setTimeout(r, RETRY_DELAY));
          } else {
            setErrorMsg("Server is taking longer than usual. Please refresh in a moment.");
            setLoadingData(false);
          }
        }
      }
    }

    attemptLoad();
    return () => { cancelled = true; };
  }, []);

  // ---- switch to a different athlete ----
  const selectPlayer = async (id) => {
    if (id === playerId) return;
    setPlayerId(id);
    clearInProgress();
    setTab("log");
    try {
      const loaded = await getSessions(id);
      setSessions(loaded);
    } catch (err) {
      setErrorMsg("Couldn't load that athlete's sessions. Try refreshing.");
    }
  };

  // ---- open the add / edit dialogs ----
  const openAdd = () => { setAthleteModalMode("add"); setEditingPlayer(null); setAthleteModalOpen(true); };
  const openEdit = (p) => { setAthleteModalMode("edit"); setEditingPlayer(p); setAthleteModalOpen(true); };

  // ---- add OR rename, depending on the modal mode (throws on failure) ----
  const submitAthlete = async (name) => {
    if (athleteModalMode === "edit" && editingPlayer) {
      const updated = await updatePlayer(editingPlayer.id, name);
      setPlayers((prev) => prev.map((p) => (p.id === editingPlayer.id ? updated : p)));
    } else {
      const newPlayer = await createPlayer(name);
      setPlayers((prev) => [...prev, newPlayer]);
      setPlayerId(newPlayer.id);
      setSessions([]);
      clearInProgress();
      setTab("log");
    }
  };

  // ---- delete an athlete (throws on failure) ----
  const confirmDelete = async () => {
    const target = deleteTarget;
    if (!target) return;
    await deletePlayer(target.id);
    const remaining = players.filter((p) => p.id !== target.id);
    setPlayers(remaining);
    // if we just deleted the athlete we were viewing, switch to another
    if (target.id === playerId && remaining.length > 0) {
      const next = remaining[0];
      setPlayerId(next.id);
      clearInProgress();
      setTab("log");
      const loaded = await getSessions(next.id);
      setSessions(loaded);
    }
  };

  // ---- live totals for the current session ----
  const sessionMakes = Object.values(spotData).reduce((s, d) => s + d.makes, 0);
  const sessionAtt = Object.values(spotData).reduce((s, d) => s + d.attempts, 0);
  const sessionPct = sessionAtt ? Math.round((sessionMakes / sessionAtt) * 100) : 0;

  // ---- career summary for the header stat strip (current athlete) ----
  const careerMakes = sessions.reduce((s, ses) => s + sumSpots(ses, "makes"), 0);
  const careerAtt = sessions.reduce((s, ses) => s + sumSpots(ses, "attempts"), 0);
  const careerPct = careerAtt ? Math.round((careerMakes / careerAtt) * 100) : 0;
  const streak = currentStreak(sessions);
  const todayLabel = new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

  const logShot = (made) => {
    if (!selectedSpot) return;
    setSpotData((prev) => {
      const cur = prev[selectedSpot] || { makes: 0, attempts: 0 };
      return { ...prev, [selectedSpot]: { makes: cur.makes + (made ? 1 : 0), attempts: cur.attempts + 1 } };
    });
  };

  const logSet = (made, total) => {
    if (!selectedSpot) return;
    const m = Math.max(0, Math.floor(made));
    const t = Math.max(0, Math.floor(total));
    if (t === 0 || m > t) return;
    setSpotData((prev) => {
      const cur = prev[selectedSpot] || { makes: 0, attempts: 0 };
      return { ...prev, [selectedSpot]: { makes: cur.makes + m, attempts: cur.attempts + t } };
    });
  };

  const undoSpot = () => {
    if (!selectedSpot) return;
    setSpotData((prev) => {
      const cur = prev[selectedSpot];
      if (!cur || cur.attempts === 0) return prev;
      return { ...prev, [selectedSpot]: { makes: Math.max(0, cur.makes - 1), attempts: cur.attempts - 1 } };
    });
  };

  const toggleFocus = (f) =>
    setFocus((cur) => (cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f]));

  const saveSession = async () => {
    if (sessionAtt === 0) {
      alert("Log at least one shot before saving.");
      return;
    }
    try {
      await createSession(playerId, date, focus.join(", "), spotData);
      const loaded = await getSessions(playerId);
      setSessions(loaded);
      clearInProgress();
      setTab("progress");
    } catch (err) {
      alert("Couldn't save the session. Check that the backend is running.");
    }
  };

  // ---- loading / waking-up screen ----
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
      <style>{CUSTOM_CSS}</style>

      {/* top bar — greeting + date on the left, account menu on the right;
          transparent (no box) and both ends filled so nothing floats alone */}
      <div className="ps-topbar ps-topbar--bare ps-topbar--split">
        <div className="ps-greeting">
          <div className="ps-greeting-label">Welcome back</div>
          <div className="ps-greeting-date">{todayLabel}</div>
        </div>
        <AccountMenu
          players={players} playerId={playerId}
          onSelect={selectPlayer} onAdd={openAdd} onEdit={openEdit}
          onDelete={(p) => setDeleteTarget(p)} onLogout={onLogout}
        />
      </div>

      <header className="hl-header">
        <img
          src="/PureSwish_Logo_Transparent.png"
          alt="PureSwish"
          style={{ maxWidth: '320px', width: '100%', height: 'auto', display: 'block', margin: '0 auto' }}
        />
        {/* season summary chips for the current athlete — fills the header */}
        <div className="ps-statstrip">
          <div className="ps-stat">
            <span className="ps-stat-val">{streak}<span className="ps-stat-unit">d</span></span>
            <span className="ps-stat-lbl">🔥 Streak</span>
          </div>
          <div className="ps-stat">
            <span className="ps-stat-val ps-stat-gold">{careerAtt ? careerPct + "%" : "—"}</span>
            <span className="ps-stat-lbl">Career FG%</span>
          </div>
          <div className="ps-stat">
            <span className="ps-stat-val">{careerMakes.toLocaleString()}</span>
            <span className="ps-stat-lbl">Total Makes</span>
          </div>
        </div>
      </header>
      {errorMsg && <p style={{ textAlign: "center", color: "#ff7675" }}>{errorMsg}</p>}

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

      {/* dialogs */}
      <AthleteModal
        open={athleteModalOpen}
        mode={athleteModalMode}
        initialName={athleteModalMode === "edit" && editingPlayer ? editingPlayer.name : ""}
        onClose={() => setAthleteModalOpen(false)}
        onSubmit={submitAthlete}
      />
      <ConfirmDeleteModal
        open={!!deleteTarget}
        name={deleteTarget ? deleteTarget.name : ""}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

export default HoopLab;