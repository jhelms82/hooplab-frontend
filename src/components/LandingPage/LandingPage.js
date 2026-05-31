import { useState } from "react";
import "./LandingPage.css";
// NOTE: styles live in LandingPage.css (separate file, your convention).

// ============================================================================
// LandingPage — HoopLab front door, basketball-goal themed.
// A backboard + rim + net and a basketball sit faded in the hero background
// (all SVG). Props match your other landing page:
//   onLogin  -> login screen
//   onSignup -> signup screen
// ============================================================================
function LandingPage({ onLogin = () => {}, onSignup = () => {} }) {
  const [openFaq, setOpenFaq] = useState(null);

  const features = [
    { icon: "🎯", title: "Track Every Shot", text: "Tap the spot, log makes and misses. Build a real shooting record one rep at a time." },
    { icon: "🔥", title: "Hot & Cold Zones", text: "See exactly which spots are money and which need work — color-coded right on the court." },
    { icon: "📈", title: "Proof It's Working", text: "Watch shooting percentage climb week over week. The progress parents want to see." },
    { icon: "⚡", title: "Daily Goal & Streaks", text: "Chase the daily makes goal and keep the streak alive. The reason to pick up the ball tomorrow." },
  ];

  const steps = [
    { n: "1", title: "Pick a spot", text: "Tap where you're shooting from on the half-court." },
    { n: "2", title: "Log your reps", text: "Hit make or miss as you go. Totals update live." },
    { n: "3", title: "See the growth", text: "Trends, streaks, and a shot chart that tells the story." },
  ];

  const faqs = [
    { q: "Who is HoopLab for?", a: "Serious young players and the parents and trainers helping them improve. If a kid is putting up shots every day, HoopLab turns that work into visible progress." },
    { q: "Is this like GameChanger?", a: "GameChanger is built for tracking games and teams. HoopLab is built for individual skill development — the daily shooting work that happens between games." },
    { q: "What do I need to use it?", a: "Just a phone and a hoop. Tap as you shoot. No extra equipment, no cameras, no setup." },
  ];

  return (
    <div className="hll">
      {/* ================= HERO ================= */}
      <section className="hll-hero">
        {/* basketball goal in the background */}
        <Hoop className="hll-hoop-bg" />
        {/* a basketball, as if mid-shot toward the rim */}
        <Basketball className="hll-ball hll-ball-shot" />
        {/* a second faded ball, lower left */}
        <Basketball className="hll-ball hll-ball-corner" />

        <div className="hll-hero-content">
          <div className="hll-badge">🏀 For players who put in the work</div>

          {/* logo replaces the old text title (its tagline covers the subtitle) */}
          <img
            src="/logo_no_background.png"
            alt="HoopLab"
            className="hll-logo-img"
          />

          <p className="hll-desc">
            Log every shot, find your hot and cold zones, and watch your percentage
            climb. The development tracker for serious hoopers — and the parents and
            trainers in their corner.
          </p>

          <div className="hll-cta-row">
            <button className="hll-btn hll-btn-primary" onClick={onSignup}>⚡ Start Free</button>
            <button className="hll-btn hll-btn-secondary" onClick={onLogin}>🔐 Log In</button>
          </div>

          <div className="hll-stat-strip">
            <div className="hll-strip-item"><span className="hll-strip-num">200</span><span className="hll-strip-label">makes a day</span></div>
            <div className="hll-strip-divider" />
            <div className="hll-strip-item"><span className="hll-strip-num">9</span><span className="hll-strip-label">court spots</span></div>
            <div className="hll-strip-divider" />
            <div className="hll-strip-item"><span className="hll-strip-num">1</span><span className="hll-strip-label">streak to protect</span></div>
          </div>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section className="hll-section">
        <h2 className="hll-section-title">Everything you need to get better</h2>
        <div className="hll-feature-grid">
          {features.map((f) => (
            <div className="hll-feature" key={f.title}>
              <div className="hll-feature-icon">{f.icon}</div>
              <h3 className="hll-feature-title">{f.title}</h3>
              <p className="hll-feature-text">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* basketball-seam divider */}
      <div className="hll-divider" aria-hidden="true">
        <Basketball className="hll-divider-ball" />
      </div>

      {/* ================= HOW IT WORKS ================= */}
      <section className="hll-section">
        <h2 className="hll-section-title">How it works</h2>
        <div className="hll-steps">
          {steps.map((s) => (
            <div className="hll-step" key={s.n}>
              <div className="hll-step-num">{s.n}</div>
              <h3 className="hll-step-title">{s.title}</h3>
              <p className="hll-step-text">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= FAQ ================= */}
      <section className="hll-section">
        <h2 className="hll-section-title">Questions</h2>
        <div className="hll-faqs">
          {faqs.map((f, i) => (
            <div className="hll-faq" key={i} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
              <div className="hll-faq-q">
                <span>{f.q}</span>
                <span className="hll-faq-toggle">{openFaq === i ? "–" : "+"}</span>
              </div>
              {openFaq === i && <p className="hll-faq-a">{f.a}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* ================= FINAL CTA ================= */}
      <section className="hll-final">
        <Hoop className="hll-hoop-final" />
        <h2 className="hll-final-title">Put the work in. See it pay off.</h2>
        <button className="hll-btn hll-btn-primary hll-btn-big" onClick={onSignup}>⚡ Start Free</button>
      </section>

      <footer className="hll-footer">🏀 HoopLab · © 2026</footer>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Hoop — a basketball goal drawn in SVG: backboard, target square, rim, net.
// ----------------------------------------------------------------------------
function Hoop({ className }) {
  return (
    <svg className={className} viewBox="0 0 120 150" aria-hidden="true">
      <rect x="18" y="6" width="84" height="56" rx="3" className="hll-hoop-board" />
      <rect x="44" y="26" width="32" height="24" className="hll-hoop-square" />
      <ellipse cx="60" cy="70" rx="28" ry="6" className="hll-hoop-rim" />
      <g className="hll-hoop-net">
        <line x1="34" y1="72" x2="44" y2="112" />
        <line x1="42" y1="74" x2="49" y2="112" />
        <line x1="51" y1="75" x2="54" y2="113" />
        <line x1="60" y1="76" x2="60" y2="113" />
        <line x1="69" y1="75" x2="66" y2="113" />
        <line x1="78" y1="74" x2="71" y2="112" />
        <line x1="86" y1="72" x2="76" y2="112" />
        <path d="M 36 86 Q 60 94 84 86" fill="none" />
        <path d="M 44 100 Q 60 106 76 100" fill="none" />
        <path d="M 45 112 Q 60 116 75 112" fill="none" />
      </g>
    </svg>
  );
}

// ----------------------------------------------------------------------------
// Basketball — circle + the four classic seams.
// ----------------------------------------------------------------------------
function Basketball({ className }) {
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="46" className="hll-ball-body" />
      <line x1="50" y1="4" x2="50" y2="96" className="hll-ball-seam" />
      <line x1="4" y1="50" x2="96" y2="50" className="hll-ball-seam" />
      <path d="M 14 18 Q 50 50 14 82" fill="none" className="hll-ball-seam" />
      <path d="M 86 18 Q 50 50 86 82" fill="none" className="hll-ball-seam" />
    </svg>
  );
}

export default LandingPage;