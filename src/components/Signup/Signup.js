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
    confirmPassword: '',
    playerName: '',
  });
  // NOTE: confirmPassword is new — the user types the password twice so we can
  // catch typos before creating the account.

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // NOTE: checks the password meets our rules. Returns an error message
  // string if something's wrong, or "" if it's all good.
  const validatePassword = (pw) => {
    if (pw.length < 8) return 'Password must be at least 8 characters.';
    if (!/[0-9]/.test(pw)) return 'Password must include at least one number.';
    return '';
    // NOTE: /[0-9]/.test(pw) is true if the password contains any digit 0-9.
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // NOTE: all fields filled?
    if (!formData.username || !formData.password || !formData.playerName) {
      setError('Please fill in all fields.');
      return;
    }

    // NOTE: password rules (length + a number)
    const pwError = validatePassword(formData.password);
    if (pwError) {
      setError(pwError);
      return;
    }

    // NOTE: the two password fields must match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const token = await signup(formData.username, formData.password, formData.email);
      saveToken(token);
      localStorage.setItem('hooplab_playername', formData.playerName);
      onSignupSuccess();
    } catch (err) {
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
          <h2>Join PureSwish</h2>
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
              placeholder="At least 8 characters, include a number"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Re-type your password"
              value={formData.confirmPassword}
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