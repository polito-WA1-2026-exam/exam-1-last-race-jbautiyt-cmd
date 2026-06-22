// ─── ProtectedRoute — guard for private routes ────────────────────────────────
// This component wraps routes that require authentication.
// If the user is not logged in, it redirects automatically to /login.

import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  // Still checking whether there is an active session — wait without rendering anything
  if (loading) {
    return <p className="status-msg">Loading...</p>;
  }

  // No active session — redirect to the login page
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}