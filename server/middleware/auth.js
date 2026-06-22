// ─── Authentication middleware ────────────────────────────────────────────────
// A middleware is a function that runs BEFORE the route handler.
// This middleware protects routes: if the user is not authenticated, it returns 401.

// req = request object, res = response object, next = function to pass to the next middleware
export function requireAuth(req, res, next) {
  if (req.isAuthenticated()) {
    // req.isAuthenticated() is a method added by Passport
    // returns true if there is a valid user in req.user (loaded by deserializeUser)
    return next(); // user is authenticated → continue to the route handler
  }
  // User is not authenticated → return 401 Unauthorized
  return res.status(401).json({ error: 'Authentication required' });
}
