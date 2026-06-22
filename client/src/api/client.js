// ─── Centralised HTTP client ──────────────────────────────────────────────────
// All fetch() calls to the server go through this file.
// Centralising the calls in one place avoids repeating error-handling logic
// and makes it easy to change the base URL if needed.

const API_BASE = 'http://localhost:3001/api'; // base URL of the Express server

// Internal function that performs the fetch and handles errors uniformly
async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include', // IMPORTANT: includes session cookies in cross-origin requests
    headers: {
      'Content-Type': 'application/json', // tells the server the body is JSON
      ...(options.headers || {}),         // allows adding extra headers if passed in options
    },
    ...options, // spread: includes method, body, etc. passed in options
  });

  // Try to parse the response as JSON (if it fails, use an empty object)
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // res.ok is false for HTTP 4xx and 5xx codes
    const error = new Error(data.error || 'Request failed'); // use the server error message if available
    error.status = res.status; // attach the HTTP code to the error so the component can use it
    throw error; // throw the error so the component can catch it with try/catch or .catch()
  }

  return data; // return the data if everything went well
}

// Object with all API methods, organised by functionality
export const api = {
  // ── Authentication ─────────────────────────────────────────────────────────
  getCurrentUser: () => request('/sessions/current'),              // GET: user of the current session
  login: (username, password) =>
    request('/sessions/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),                 // POST with credentials in the body
    }),
  logout: () => request('/sessions/logout', { method: 'POST' }),  // POST: close session

  // ── Ranking ────────────────────────────────────────────────────────────────
  getRanking: () => request('/ranking'),                            // GET: global ranking

  // ── Metro network ──────────────────────────────────────────────────────────
  getFullNetwork: () => request('/network/full'),                   // GET: full network with lines (Setup phase)
  getPlanningNetwork: () => request('/network/planning'),           // GET: stations and segments without lines (Planning phase)

  // ── Game ───────────────────────────────────────────────────────────────────
  createGame: () => request('/games', { method: 'POST' }),          // POST: create new game
  getGame: (id) => request(`/games/${id}`),                         // GET: current state of a game
  advancePhase: (id, phase) =>
    request(`/games/${id}/advance`, {
      method: 'POST',
      body: JSON.stringify({ phase }),                               // POST: advance to the next phase
    }),
  submitRoute: (id, route) =>
    request(`/games/${id}/route`, {
      method: 'PUT',
      body: JSON.stringify({ route }),                               // PUT: submit the built route
    }),
  getExecutionStep: (id) => request(`/games/${id}/execution-step`), // GET: current execution step
  nextExecutionStep: (id) =>
    request(`/games/${id}/execution-next`, { method: 'POST' }),     // POST: advance to the next step
};
