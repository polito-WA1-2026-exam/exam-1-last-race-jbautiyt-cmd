// ─── Root application component ───────────────────────────────────────────────
// Defines the route structure of the SPA (Single Page Application).
// All routes share the Layout (navigation bar).
// Game routes are protected: they require login.

import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RankingPage from './pages/RankingPage.jsx';
import SetupPage from './pages/game/SetupPage.jsx';
import PlanningPage from './pages/game/PlanningPage.jsx';
import ExecutionPage from './pages/game/ExecutionPage.jsx';
import ResultPage from './pages/game/ResultPage.jsx';
import './App.css';

function App() {
  return (
    // AuthProvider wraps the ENTIRE app so any component can read the login state
    <AuthProvider>
      {/* BrowserRouter enables SPA navigation with the browser's History API */}
      <BrowserRouter>
        <Routes>
          {/* Layout is the "frame" component: renders the navbar then the content via Outlet */}
          <Route element={<Layout />}>

            {/* PUBLIC routes — accessible without login */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/ranking" element={<RankingPage />} />

            {/* PROTECTED routes — ProtectedRoute redirects to /login if not authenticated */}
            <Route
              path="/game/setup"
              element={
                <ProtectedRoute>
                  <SetupPage />
                </ProtectedRoute>
              }
            />
            {/* :gameId is a dynamic URL parameter */}
            <Route
              path="/game/planning/:gameId"
              element={
                <ProtectedRoute>
                  <PlanningPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/game/execution/:gameId"
              element={
                <ProtectedRoute>
                  <ExecutionPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/game/result/:gameId"
              element={
                <ProtectedRoute>
                  <ResultPage />
                </ProtectedRoute>
              }
            />

            {/* Wildcard route: any unknown URL redirects to the home page */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;