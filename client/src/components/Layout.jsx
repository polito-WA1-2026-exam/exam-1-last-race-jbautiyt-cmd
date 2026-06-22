// ─── Layout — shared frame for all pages ─────────────────────────────────────
// This component contains the top navigation bar.
// Uses <Outlet /> from react-router-dom to render the current page inside the frame.

import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function Layout() {
  const { user, isAuthenticated, logout, loading } = useAuth();

  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/" className="brand">
          Last Race
        </Link>

        <nav className="app-nav">
          <Link to="/">Instructions</Link>
          <Link to="/ranking">Ranking</Link>

          {isAuthenticated ? (
            <>
              <Link to="/game/setup">New game</Link>
              <span className="nav-user">Hello, {user.username}</span>
              <button type="button" className="btn-link" onClick={() => logout()}>
                Log out
              </button>
            </>
          ) : (
            <Link to="/login">Log in</Link>
          )}
        </nav>
      </header>

      <main className="app-main">
        {/* While loading is true (checking session on startup), render nothing.
            This prevents briefly showing incorrect content before knowing if there is a session. */}
        {!loading && <Outlet />}
      </main>
    </div>
  );
}