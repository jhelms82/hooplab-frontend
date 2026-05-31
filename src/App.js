import { useState } from 'react';
import './App.css';
import LandingPage from './components/LandingPage/LandingPage';
import Login from './components/Login/Login';
import Signup from './components/Signup/Signup';
import HoopLab from './components/HoopLab/HoopLab';
import { getToken, clearToken } from './api';
// NOTE: getToken reads the saved login token; clearToken removes it (logout).

function App() {
  const [currentPage, setCurrentPage] = useState('landing');

  // NOTE: THIS is the fix. Instead of always starting logged out, we check
  // for a saved token when the app first loads. If one exists, we start
  // already logged in — so a refresh keeps you in instead of kicking you out.
  // useState(() => ...) runs this check once, on first load.
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return getToken() ? true : false;
  });

  const handleLogin = () => setCurrentPage('login');
  const handleSignup = () => setCurrentPage('signup');
  const handleBackToLanding = () => setCurrentPage('landing');

  const handleLoginSuccess = () => setIsLoggedIn(true);
  const handleSignupSuccess = () => setIsLoggedIn(true);

  const handleLogout = () => {
    // NOTE: now logout also CLEARS the token, so you're truly logged out
    // (otherwise the token would still be there and a refresh logs you back in).
    clearToken();
    setIsLoggedIn(false);
    setCurrentPage('landing');
  };

  // NOTE: if NOT logged in, show the auth pages
  if (!isLoggedIn) {
    if (currentPage === 'landing') {
      return (
        <LandingPage
          onLogin={handleLogin}
          onSignup={handleSignup}
        />
      );
    }

    if (currentPage === 'login') {
      return (
        <Login
          onBack={handleBackToLanding}
          onLoginSuccess={handleLoginSuccess}
        />
      );
    }

    if (currentPage === 'signup') {
      return (
        <Signup
          onBack={handleBackToLanding}
          onSignupSuccess={handleSignupSuccess}
        />
      );
    }
  }

  // NOTE: logged in — header, log out button, and HoopLab.
  return (
    <div className="App">

      <div style={topBarStyle}>
        <button style={logoutBtnStyle} onClick={handleLogout}>
          Log Out
        </button>
      </div>

      <HoopLab />
    </div>
  );
}

const topBarStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  padding: '1rem',
  maxWidth: 700,
  margin: '0 auto',
};
const logoutBtnStyle = {
  padding: '0.7rem 1.2rem',
  borderRadius: 10,
  border: '2px solid rgba(255, 255, 255, 0.3)',
  background: 'transparent',
  color: 'rgba(255, 255, 255, 0.85)',
  fontWeight: 700,
  cursor: 'pointer',
  textTransform: 'uppercase',
};

export default App;