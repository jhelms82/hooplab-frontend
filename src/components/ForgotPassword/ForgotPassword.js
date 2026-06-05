import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../Auth.css';
import { requestPasswordReset } from '../../api';

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await requestPasswordReset(email);
      // NOTE: backend always returns the same message whether or not the email
      // exists (so nobody can probe which emails have accounts).
      setMessage(res.message || 'If an account exists for that email, a reset link has been sent.');
    } catch (err) {
      setMessage('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-icon">🔑</div>
          <h2>Reset Password</h2>
          <p>Enter your email and we'll send you a reset link</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {message && <p style={{ color: '#7bed9f', margin: 0 }}>{message}</p>}

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? 'Sending…' : 'Send Reset Link'}
          </button>
        </form>

        <button className="back-btn" onClick={() => navigate('/login')}>
          ← Back to Login
        </button>
      </div>
    </div>
  );
}

export default ForgotPassword;