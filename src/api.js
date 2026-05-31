// ============================================================================
// api.js — one place that knows how to talk to the Django backend.
// Every component imports these functions instead of writing fetch() calls
// all over the place. Change the address once here, everywhere updates.
// ============================================================================

// NOTE: where the backend lives. When you deploy later, this becomes your
// real server URL — and it's the ONLY line you change to point at production.
const API_URL = "http://localhost:8000/api";

// NOTE: how long a login lasts before we make you sign in again.
const TOKEN_LIFETIME_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// ---- token storage (with a 24-hour expiry) ----

// NOTE: save the token AND the moment we saved it, so we can expire it later.
export function saveToken(token) {
  localStorage.setItem("hooplab_token", token);
  localStorage.setItem("hooplab_token_time", Date.now().toString());
}

// NOTE: read the token — but if it's older than 24 hours, treat it as gone.
export function getToken() {
  const token = localStorage.getItem("hooplab_token");
  const savedTime = localStorage.getItem("hooplab_token_time");
  if (!token || !savedTime) return null;

  const age = Date.now() - Number(savedTime); // how long ago we saved it
  if (age > TOKEN_LIFETIME_MS) {
    clearToken(); // expired — wipe it and act like there's no token
    return null;
  }
  return token;
}

export function clearToken() {
  localStorage.removeItem("hooplab_token");
  localStorage.removeItem("hooplab_token_time");
}

// ---- SIGN UP: create an account, get a token back ----
export async function signup(username, password, email) {
  const res = await fetch(`${API_URL}/signup/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, email }),
  });
  if (!res.ok) throw new Error("Signup failed");
  const data = await res.json();
  return data.token;
}

// ---- LOG IN: send username/password, get a token back ----
export async function login(username, password) {
  const res = await fetch(`${API_URL}/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error("Login failed");
  const data = await res.json();
  return data.token;
}

// ---- authenticated request helper ----
// NOTE: attaches the login token as an ID badge on every protected call.
async function authFetch(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Token ${token}`,
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    console.log("API error:", res.status, text);
    throw new Error(`Request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// ---- PLAYERS ----
export async function getPlayers() {
  return authFetch("/players/");
}
export async function createPlayer(name) {
  return authFetch("/players/", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

// ---- SESSIONS ----
export async function getSessions(playerId) {
  const all = await authFetch("/sessions/");
  const mine = all.filter((s) => s.player === playerId);

  // NOTE: the backend returns shots as an ARRAY under "shots". Our frontend
  // expects an OBJECT keyed by spot, under "spots". Convert each session so
  // the rest of the app works unchanged.
  return mine.map((s) => {
    const spots = {};
    for (const shot of s.shots) {
      spots[shot.spot] = { makes: shot.makes, attempts: shot.attempts };
    }
    return {
      id: s.id,
      date: s.date,
      focus: s.focus ? s.focus.split(", ").filter(Boolean) : [],
      spots,
    };
  });
}

export async function createSession(playerId, date, focus, shots) {
  // NOTE: first create the session...
  const session = await authFetch("/sessions/", {
    method: "POST",
    body: JSON.stringify({ player: playerId, date, focus }),
  });
  // NOTE: ...then create each shot entry attached to that session.
  for (const spot in shots) {
    await authFetch("/shots/", {
      method: "POST",
      body: JSON.stringify({
        session: session.id,
        spot,
        makes: shots[spot].makes,
        attempts: shots[spot].attempts,
      }),
    });
  }
  return session;
}