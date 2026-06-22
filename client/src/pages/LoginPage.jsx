// ─── LoginPage — login form ────────────────────────────────────────────────────
// Shows a login form and, if the user is already authenticated, redirects them.

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function LoginPage() {
  const { login, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // If already authenticated, redirect directly to setup without showing the form
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/game/setup', { replace: true });
    }
  }, [loading, isAuthenticated, navigate]);

  if (loading || isAuthenticated) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('Please enter username and password.');
      return;
    }

    try {
      await login(username.trim(), password);
      navigate('/game/setup');
    } catch {
      setError('Invalid credentials.');
    }
  };

  return (
    <section className="page login-page">
      <h1>Log in</h1>
      <form onSubmit={handleSubmit} className="login-form">
        <label>
          Username
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </label>
        {error && <p className="error-msg">{error}</p>}
        <button type="submit" className="btn-primary">
          Sign in
        </button>
      </form>
    </section>
  );
}