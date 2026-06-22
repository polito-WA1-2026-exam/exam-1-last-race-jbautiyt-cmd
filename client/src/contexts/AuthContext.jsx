// ─── Authentication context ───────────────────────────────────────────────────
// React Context is a way to share data between components
// without having to pass props manually through every level of the tree.
// This context exposes: the current user, loading state, login and logout.

import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client.js'; // functions to call the server

// createContext creates the "container" of the context.
// null is the default value if used outside the Provider (helps catch errors).
const AuthContext = createContext(null);

// AuthProvider is the component that "provides" the state to all its children.
// It is placed in App.jsx wrapping the entire application.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);   // logged-in user object, or null if no session
  const [loading, setLoading] = useState(true); // true while the session is being checked on startup

  // When the app mounts, check whether an active session already exists (server cookie).
  // The empty array [] means "run this effect only once, on mount".
  useEffect(() => {
    api.getCurrentUser()
      .then((current) => setUser(current))  // session found → store the user
      .catch(() => setUser(null))           // no session → user = null
      .finally(() => setLoading(false));    // in either case, stop "loading"
  }, []); // empty dependencies = run only when the component mounts

  // login: calls the server with the credentials and stores the user in state
  const login = async (username, password) => {
    const logged = await api.login(username, password); // throws if credentials are wrong
    setUser(logged); // update state → all components using useAuth() re-render
    return logged;
  };

  // logout: closes the session on the server and clears the local state
  const logout = async () => {
    await api.logout(); // destroys the session on the server and clears the cookie
    setUser(null);      // clear the user from state → app returns to unauthenticated mode
  };

  // AuthContext.Provider makes the value accessible to any child component
  // isAuthenticated: true if user is not null (double negation converts to boolean)
  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children} {/* renders all child components wrapped in the Provider */}
    </AuthContext.Provider>
  );
}

// useAuth is the custom hook to consume the context.
// Any component can call: const { user, login } = useAuth()
export function useAuth() {
  const ctx = useContext(AuthContext); // gets the current context value
  if (!ctx) throw new Error('useAuth must be used within AuthProvider'); // guard: if used outside the Provider
  return ctx;
}
