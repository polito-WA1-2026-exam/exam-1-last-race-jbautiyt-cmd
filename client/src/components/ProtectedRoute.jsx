// ─── ProtectedRoute — guard for private routes ────────────────────────────────
// This component wraps routes that require authentication.
// If the user is not logged in, it redirects automatically to /login.

import { Navigate } from 'react-router-dom'; // component that redirects to another URL
import { useAuth } from '../contexts/AuthContext.jsx';

// children is the protected route component (e.g. <SetupPage />)
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    // Still checking whether there is an active session → wait without rendering anything
    // This prevents redirecting to login before knowing if the user is logged in
    return <p className="status-msg">Loading...</p>;
  }

  if (!isAuthenticated) {
    // No active session → redirect to the login page
    // replace={true} prevents the previous URL from staying in the browser history
    return <Navigate to="/login" replace />;
  }

  // User is authenticated → render the protected component
  return children;
}
