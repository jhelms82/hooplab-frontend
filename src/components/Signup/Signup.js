import { useState } from 'react';
import '../../Auth.css';
import { signup, saveToken } from '../../api';
// NOTE: signup() creates the account on the backend and returns a token;
// saveToken() stores it so the user is logged in right after signing up.

function Signup({ onBack, onSignupSuccess }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    playerName: '',
  });
  // NOTE: the backend account needs username/email/password. playerName is
  // the kid being tracked — we collect it here, and we'll use it to create
  // their first Player record once HoopLab talks to the API.

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.username || !formData.password || !formData.playerName) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      // NOTE: create the account on the backend, get a token back.
      const token = await signup(formData.username, formData.password, formData.email);
      saveToken(token);
      // NOTE: stash the player name for later (when HoopLab creates the player).
      localStorage.setItem('hooplab_playername', formData.playerName);
      onSignupSuccess();
    } catch (err) {
      // NOTE: most common cause is the username already being taken.
      setError('Could not create account. That username may be taken.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Hoop className="auth-hoop" />

      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-icon">⚡</div>
          <h2>Join HoopLab</h2>
          <p>Create your account and start tracking shots</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              name="username"
              placeholder="Pick a username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="Create a strong password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Player Name</label>
            <input
              type="text"
              name="playerName"
              placeholder="The player you're tracking"
              value={formData.playerName}
              onChange={handleChange}
              required
            />
          </div>

          {error && <p style={{ color: '#ff7675', margin: 0 }}>{error}</p>}

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? 'Creating account…' : '⚡ Create Account'}
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
// Hoop — basketball goal SVG (same as the landing / login pages).
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

export default Signup;