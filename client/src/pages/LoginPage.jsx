// ─── LoginPage — login form ────────────────────────────────────────────────────
// Shows a login form and, if the user is already authenticated, redirects them.

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // hook to navigate between pages programmatically
import { useAuth } from '../contexts/AuthContext.jsx';

export default function LoginPage() {
  const { login, isAuthenticated, loading } = useAuth(); // functions and state from the auth context
  const navigate = useNavigate();                        // function to change page

  // Local form state
  const [username, setUsername] = useState('');  // value of the username field
  const [password, setPassword] = useState('');  // value of the password field
  const [error, setError] = useState('');         // error message to display

  // If the user is already authenticated (e.g. coming from another page or with an active session),
  // redirect them directly to setup without showing the form
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/game/setup', { replace: true }); // replace: does not add /login to the history
    }
  }, [loading, isAuthenticated, navigate]); // re-runs when any of these dependencies change

  // While checking the session or if already authenticated, render nothing
  // (avoids a flash of the form before the redirect)
  if (loading || isAuthenticated) {
    return null;
  }

  // Runs when the user submits the form
  const handleSubmit = async (e) => {
    e.preventDefault(); // prevents the form from reloading the page (default HTML behaviour)
    setError('');        // clear any previous error

    // Basic validation: fields cannot be empty
    if (!username.trim() || !password) {
      setError('Please enter username and password.');
      return;
    }

    try {
      await login(username.trim(), password); // calls the server; throws if credentials are wrong
      navigate('/game/setup');                // successful login → go to setup
    } catch {
      setError('Invalid credentials.'); // show error to the user (does not expose the server's internal message)
    }
  };

  return (
    <section className="page login-page">
      <h1>Log in</h1>

      {/* onSubmit calls handleSubmit instead of the default behaviour */}
      <form onSubmit={handleSubmit} className="login-form">

        <label>
          Username
          <input
            value={username}                          // the input value is controlled by React
            onChange={(e) => setUsername(e.target.value)} // updates state on every keystroke
            autoComplete="username"                   // helps the browser's password manager
          />
        </label>

        <label>
          Password
          <input
            type="password"                           // hides characters while typing
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </label>

        {/* Shows the error message only if it exists */}
        {error && <p className="error-msg">{error}</p>}

        <button type="submit" className="btn-primary">
          Sign in
        </button>
      </form>
    </section>
  );
}
