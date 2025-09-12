// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const { sendError } = require("../utils/responseHandler");

/**
 * Middleware to authorize user based on roles
 * @param {Array} roles - Array of allowed roles
 */
function authorizeRole(roles = []) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return sendError(res, 403, "Forbidden - Role not assigned");
    }
    if (roles.length === 0 || roles.includes(req.user.role)) {
      next();
    } else {
      return sendError(res, 403, "Forbidden - Insufficient role");
    }
  };
}

/**
 * Middleware to authenticate access token
 */
function authenticateAccessToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return sendError(res, 401, "Authentication required");
  }

  jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, user) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        return sendError(res, 401, "Token expired");
      } else {
        return sendError(res, 403, "Invalid token");
      }
    }
    req.user = user;
    next();
  });
}

/**
 * Middleware to refresh an expired token using refresh token
 */
function refreshToken(req, res, next) {
  const refreshToken = req.body.refreshToken;

  if (!refreshToken) {
    return sendError(res, 401, "Refresh token required");
  }

  jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, user) => {
    if (err) {
      return sendError(res, 403, "Invalid refresh token");
    }

    // Create new access token
    const accessToken = jwt.sign(
      { userId: user.userId, email: user.email, role: user.role },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "8h" }
    );

    req.newAccessToken = accessToken;
    next();
  });
}

module.exports = { authenticateAccessToken, authorizeRole, refreshToken };