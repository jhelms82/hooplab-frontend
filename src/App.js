import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import './App.css';
import LandingPage from './components/LandingPage/LandingPage';
import Login from './components/Login/Login';
import Signup from './components/Signup/Signup';
import HoopLab from './components/HoopLab/HoopLab';
import ForgotPassword from './components/ForgotPassword/ForgotPassword';
import ResetPassword from './components/ResetPassword/ResetPassword';
import ForgotUsername from './components/ForgotUsername/ForgotUsername';
import { getToken, clearToken } from './api';
// NOTE: getToken reads the saved login token; clearToken removes it (logout).

function App() {
  // NOTE: login state still works the same way — check for a saved token once
  // on first load, so a refresh keeps you logged in.
  const [isLoggedIn, setIsLoggedIn] = useState(() => (getToken() ? true : false));

  const handleLoginSuccess = () => setIsLoggedIn(true);
  const handleSignupSuccess = () => setIsLoggedIn(true);
  const handleLogout = () => {
    clearToken();
    setIsLoggedIn(false);
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* NOTE: home — logged in shows the app, logged out shows the landing page */}
        <Route
          path="/"
          element={
            isLoggedIn ? (
              <LoggedInApp onLogout={handleLogout} />
            ) : (
              <LandingRoute />
            )
          }
        />

        {/* NOTE: auth pages. If already logged in, bounce them to home. */}
        <Route
          path="/login"
          element={
            isLoggedIn ? <Navigate to="/" /> : <LoginRoute onLoginSuccess={handleLoginSuccess} />
          }
        />
        <Route
          path="/signup"
          element={
            isLoggedIn ? <Navigate to="/" /> : <SignupRoute onSignupSuccess={handleSignupSuccess} />
          }
        />

        {/* NOTE: account recovery pages — always reachable (you're locked out). */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/forgot-username" element={<ForgotUsername />} />

        {/* NOTE: any unknown URL just goes home. */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

// ----------------------------------------------------------------------------
// Small wrapper components so each page can use the router's navigate().
// (useNavigate only works INSIDE the router, so we wrap here.)
// ----------------------------------------------------------------------------

function LandingRoute() {
  const navigate = useNavigate();
  return (
    <LandingPage
      onLogin={() => navigate('/login')}
      onSignup={() => navigate('/signup')}
    />
  );
}

function LoginRoute({ onLoginSuccess }) {
  const navigate = useNavigate();
  return (
    <Login
      onBack={() => navigate('/')}
      onLoginSuccess={onLoginSuccess}
      onForgotPassword={() => navigate('/forgot-password')}
      onForgotUsername={() => navigate('/forgot-username')}
    />
  );
}

function SignupRoute({ onSignupSuccess }) {
  const navigate = useNavigate();
  return (
    <Signup
      onBack={() => navigate('/')}
      onSignupSuccess={onSignupSuccess}
    />
  );
}

// NOTE: the logged-in app. The Log Out control now lives INSIDE HoopLab's
// top-bar account menu (cleaner than a floating button), so we just hand the
// logout function down to it.
function LoggedInApp({ onLogout }) {
  return (
    <div className="App">
      <HoopLab onLogout={onLogout} />
    </div>
  );
}

export default App;