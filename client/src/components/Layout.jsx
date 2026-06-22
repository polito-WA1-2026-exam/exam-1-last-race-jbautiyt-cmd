// ─── Layout — shared frame for all pages ─────────────────────────────────────
// This component contains the top navigation bar.
// Uses <Outlet /> from react-router-dom to render the current page inside the frame.

import { Link, Outlet } from 'react-router-dom'; // Link: SPA navigation without reload; Outlet: current route content
import { useAuth } from '../contexts/AuthContext.jsx'; // reads the global auth state

export default function Layout() {
  // Extract from context: the user object, whether authenticated, the logout function, and loading state
  const { user, isAuthenticated, logout, loading } = useAuth();

  return (
    <div className="app-shell"> {/* main container: occupies full screen height */}

      <header className="app-header"> {/* fixed top navigation bar */}
        {/* Link with to="/" navigates to home without reloading the page */}
        <Link to="/" className="brand">
          Last Race
        </Link>

        <nav className="app-nav">
          <Link to="/">Instructions</Link>   {/* always visible */}
          <Link to="/ranking">Ranking</Link> {/* always visible (ranking is public) */}

          {/* Shows different options depending on whether the user is logged in */}
          {isAuthenticated ? (
            <>
              <Link to="/game/setup">New game</Link>  {/* only for logged-in users */}
              <span className="nav-user">Hello, {user.username}</span> {/* username */}
              <button type="button" className="btn-link" onClick={() => logout()}>
                Log out
              </button>
            </>
          ) : (
            <Link to="/login">Log in</Link> {/* only if not logged in */}
          )}
        </nav>
      </header>

      <main className="app-main">
        {/* While loading is true (checking session on startup), render nothing.
            This prevents briefly showing incorrect content before knowing if there is a session. */}
        {!loading && <Outlet />} {/* <Outlet /> renders the component of the current route */}
      </main>
    </div>
  );
}
