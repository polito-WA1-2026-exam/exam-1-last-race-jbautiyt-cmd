// ─── Root application component ───────────────────────────────────────────────
// Defines the route structure of the SPA (Single Page Application).
// All routes share the Layout (navigation bar).
// Game routes are protected: they require login.

import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'; // React Router
import { AuthProvider } from './contexts/AuthContext.jsx'; // provider of the global auth state
import Layout from './components/Layout.jsx';              // shared navigation bar
import ProtectedRoute from './components/ProtectedRoute.jsx'; // guards private routes
import HomePage from './pages/HomePage.jsx';               // game instructions (public)
import LoginPage from './pages/LoginPage.jsx';             // login form (public)
import RankingPage from './pages/RankingPage.jsx';         // global ranking (public)
import SetupPage from './pages/game/SetupPage.jsx';        // phase 1: view the map
import PlanningPage from './pages/game/PlanningPage.jsx';  // phase 2: build the route
import ExecutionPage from './pages/game/ExecutionPage.jsx'; // phase 3: view events
import ResultPage from './pages/game/ResultPage.jsx';      // phase 4: final result
import './App.css'; // global application styles

function App() {
  return (
    // AuthProvider wraps the ENTIRE app so any component can read the login state
    <AuthProvider>
      {/* BrowserRouter enables SPA navigation with the browser's History API */}
      <BrowserRouter>
        <Routes>
          {/* Layout is the "frame" component: renders the navbar then the content via <Outlet /> */}
          <Route element={<Layout />}>

            {/* PUBLIC routes — accessible without login */}
            <Route path="/" element={<HomePage />} />             {/* instructions */}
            <Route path="/login" element={<LoginPage />} />       {/* login */}
            <Route path="/ranking" element={<RankingPage />} />   {/* ranking */}

            {/* PROTECTED routes — ProtectedRoute redirects to /login if not authenticated */}
            <Route
              path="/game/setup"
              element={
                <ProtectedRoute>
                  <SetupPage />   {/* phase 1: view full map, create game */}
                </ProtectedRoute>
              }
            />
            <Route
              path="/game/planning/:gameId"  {/* :gameId is a dynamic URL parameter */}
              element={
                <ProtectedRoute>
                  <PlanningPage /> {/* phase 2: build the route within 90 seconds */}
                </ProtectedRoute>
              }
            />
            <Route
              path="/game/execution/:gameId"
              element={
                <ProtectedRoute>
                  <ExecutionPage /> {/* phase 3: view events segment by segment */}
                </ProtectedRoute>
              }
            />
            <Route
              path="/game/result/:gameId"
              element={
                <ProtectedRoute>
                  <ResultPage /> {/* phase 4: final score */}
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
