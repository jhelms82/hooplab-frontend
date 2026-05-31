// ============================================================================
// helpers.js — small "pure" functions (they only use their inputs and return a
// value; no state, no side effects). Pulled out so any component can import
// them and they're easy to read/test on their own.
// ============================================================================

// NOTE: today's date as "2026-05-29". toISOString gives a long string; slice
// chops it down to just the date part.
export const todayISO = () => new Date().toISOString().slice(0, 10);

// NOTE: add up one stat ("makes" or "attempts") across all spots in a session.
// Object.values turns { lc3:{...}, ft:{...} } into an array we can reduce over.
export const sumSpots = (session, key) =>
  Object.values(session.spots).reduce((sum, spot) => sum + spot[key], 0);

// NOTE: format "2026-05-29" as "May 29" for display.
export function fmtDate(iso) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// NOTE: count how many days IN A ROW (ending today or yesterday) have a session.
export function currentStreak(sessions) {
  // new Set removes duplicate dates (two sessions same day still counts as one day)
  const days = [...new Set(sessions.map((s) => s.date))].sort();
  if (days.length === 0) return 0;

  const has = new Set(days); // fast "does this date exist?" lookups
  let streak = 0;
  const d = new Date(todayISO() + "T00:00:00");

  // NOTE: if there's no session TODAY yet, start counting from yesterday so the
  // streak doesn't look broken first thing in the morning before practice.
  if (!has.has(d.toISOString().slice(0, 10))) d.setDate(d.getDate() - 1);

  // walk backwards one day at a time while each day has a session
  while (has.has(d.toISOString().slice(0, 10))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}