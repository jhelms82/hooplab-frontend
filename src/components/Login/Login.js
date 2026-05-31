import { useState } from 'react';
import '../../Auth.css';
import { login, saveToken } from '../../api';
// NOTE: pull in our two helpers from api.js:
//   login()    -> sends username/password to the backend, returns a token
//   saveToken() -> stores that token in the browser

function Login({ onBack, onLoginSuccess }) {
  const [username, setUsername] = useState('');
  // NOTE: the backend logs in by USERNAME (not email), so this field is the
  // username. We can switch to email-based login later if you want.
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  // NOTE: holds an error message to show the user if login fails.
  const [loading, setLoading] = useState(false);
  // NOTE: true while we're waiting for the backend, so we can disable the
  // button and show "Logging in..." (talking to a server isn't instant).

  const handleSubmit = async (e) => {
    // NOTE: async because we have to WAIT for the backend to respond.
    e.preventDefault();
    setError('');       // clear any old error
    setLoading(true);   // show we're working

    try {
      // NOTE: call the backend. await pauses here until it answers.
      const token = await login(username, password);
      // NOTE: success — save the token, then tell App we're logged in.
      saveToken(token);
      onLoginSuccess();
    } catch (err) {
      // NOTE: login() throws if the credentials were wrong / server unreachable
      setError('Wrong username or password.');
    } finally {
      setLoading(false); // stop the "working" state either way
    }
  };

  return (
    <div className="auth-page">
      <Hoop className="auth-hoop" />

      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-icon">🏀</div>
          <h2>Welcome Back</h2>
          <p>Log in to your HoopLab account</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              placeholder="Your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* NOTE: show the error message only if there is one */}
          {error && <p style={{ color: '#ff7675', margin: 0 }}>{error}</p>}

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {/* NOTE: button text changes while waiting on the backend */}
            {loading ? 'Logging in…' : '🔐 Log In'}
          </button>
        </form>

        <button className="back-btn" onClick={onBack}>
          ← Back to Home
        </button>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Hoop — basketball goal SVG (same as the landing / signup pages).
// ----------------------------------------------------------------------------
function Hoop({ className }) {
  return (
    <svg className={className} viewBox="0 0 120 150" aria-hidden="true">
      <rect x="18" y="6" width="84" height="56" rx="3" className="auth-hoop-board" />
      <rect x="44" y="26" width="32" height="24" className="auth-hoop-square" />
      <ellipse cx="60" cy="70" rx="28" ry="6" className="auth-hoop-rim" />
      <g className="auth-hoop-net">
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

export default Login;