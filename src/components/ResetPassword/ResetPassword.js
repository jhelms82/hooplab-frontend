import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import '../../Auth.css';
import { confirmPasswordReset } from '../../api';

function ResetPassword() {
  const navigate = useNavigate();

  // NOTE: pull uid + token out of the URL. The email link looks like:
  //   /reset-password?uid=XXX&token=YYY
  const [searchParams] = useSearchParams();
  const uid = searchParams.get('uid') || '';
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // NOTE: same password rules as signup — 8+ chars and a number.
  const validatePassword = (pw) => {
    if (pw.length < 8) return 'Password must be at least 8 characters.';
    if (!/[0-9]/.test(pw)) return 'Password must include at least one number.';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const pwError = validatePassword(password);
    if (pwError) {
      setError(pwError);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordReset(uid, token, password);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'This reset link is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  };

  // NOTE: after a successful reset, show a confirmation + link to login.
  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-header">
            <div className="auth-icon">✅</div>
            <h2>Password Reset</h2>
            <p>Your password has been updated. You can now log in.</p>
          </div>
          <button className="auth-submit-btn" onClick={() => navigate('/login')}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // NOTE: if the link is missing its uid/token, it's broken — tell them.
  if (!uid || !token) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-header">
            <div className="auth-icon">⚠️</div>
            <h2>Invalid Link</h2>
            <p>This reset link is missing information. Please request a new one.</p>
          </div>
          <button className="auth-submit-btn" onClick={() => navigate('/forgot-password')}>
            Request New Link
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-icon">🔑</div>
          <h2>Set New Password</h2>
          <p>Choose a new password for your account</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              placeholder="At least 8 characters, include a number"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Confirm New Password</label>
            <input
              type="password"
              placeholder="Re-type your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {error && <p style={{ color: '#ff7675', margin: 0 }}>{error}</p>}

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? 'Resetting…' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;