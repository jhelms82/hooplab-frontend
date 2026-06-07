// ============================================================================
// Constants.js — shared DATA used across the HoopLab components.
// NOTE: Single source of truth for the court. Add or change a spot here and
// EVERYTHING updates automatically — the court drawing, the logging buttons,
// the hot/cold zones, and the per-spot percentages.
// ============================================================================

// NOTE: the daily makes goal (your son's 200-shot routine).
export const DAILY_GOAL = 200;

// NOTE: the shot-type categories, in display order. Each spot below belongs to
// exactly one of these via its `category` field. The Progress tab groups all
// the per-spot makes/attempts into these buckets to show a breakdown.
export const CATEGORIES = ["3PT", "Midrange", "Free Throw", "Finishing"];

// NOTE: every shooting spot. x/y are coordinates inside the SVG court (Court.js).
//   three: true  -> a 3-point spot
//   three: false -> a 2-point (mid-range or rim) spot
//   category     -> which CATEGORIES bucket this spot rolls up into
// short: the little label shown inside the circle (keep it 2–3 characters).
//
// Court orientation reminder: the basket is at the TOP (around x:150, y:38).
// Bigger y = farther from the basket. "Behind the 3-point line" means the
// corner/wing spots sit OUTSIDE the arc — corners pushed toward the sidelines,
// wings pushed down and out.
export const SPOTS = [
  // ---- THREE-POINTERS (behind the arc) ----
  { id: "lc3",  label: "Left Corner 3",  short: "LC3", x: 22,  y: 46,  three: true,  category: "3PT" },  // moved out to the corner
  { id: "lw3",  label: "Left Wing 3",    short: "LW3", x: 62,  y: 165, three: true,  category: "3PT" },  // moved out to sit outside the deeper arc
  { id: "top3", label: "Top of Key 3",   short: "TOP", x: 150, y: 208, three: true,  category: "3PT" },
  { id: "rw3",  label: "Right Wing 3",   short: "RW3", x: 238, y: 165, three: true,  category: "3PT" },  // moved out to sit outside the deeper arc
  { id: "rc3",  label: "Right Corner 3", short: "RC3", x: 278, y: 46,  three: true,  category: "3PT" },  // moved out to the corner

  // ---- MID-RANGE (inside the arc) ----
  { id: "lbm",  label: "Left Baseline (Midrange)",  short: "LBM", x: 80,  y: 56,  three: false, category: "Midrange" },
  { id: "le",   label: "Left Wing (Midrange)",  short: "LWM", x: 100, y: 120, three: false, category: "Midrange" },
  { id: "tkm",  label: "Top of Key (Midrange)", short: "TKM", x: 150, y: 170, three: false, category: "Midrange" },  // top-of-key pull-up, between FT and the arc
  { id: "re",   label: "Right Wing (Midrange)", short: "RWM", x: 200, y: 120, three: false, category: "Midrange" },
  { id: "rbm",  label: "Right Baseline (Midrange)", short: "RBM", x: 220, y: 56,  three: false, category: "Midrange" },

  // ---- FREE THROW (its own category) ----
  { id: "ft",   label: "Free Throw",     short: "FT",  x: 150, y: 132, three: false, category: "Free Throw" },

  // ---- AT THE RIM ----
  { id: "paint", label: "Finish at Rim", short: "RIM", x: 150, y: 66, three: false, category: "Finishing" },
];

// NOTE: the trainer's focus areas, shown as tappable tags on the log screen.
export const FOCUS_AREAS = ["Catch and Shoot",  "Shooting Off Dribble", "Finishing", "Pick-and-Roll Reads", "Passing"];