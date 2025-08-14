// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");

function authorizeRole(roles = []) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      res.statusCode = 403;
      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify({ message: "Forbidden - Role not assigned" }));
    }
    if (roles.length === 0 || roles.includes(req.user.role)) {
      next();
    } else {
      res.statusCode = 403;
      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify({ message: "Forbidden - Insufficient role" }));
    }
  };
}

function authenticateAccessToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.statusCode = 401;
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify({ message: "Authentication required" }));
  }
  
  jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, user) => {
    if (err) {
      // err will contain information about the error, including expiration
      console.error("Token verification error:", err.message); // Log the specific error

      if (err.name === "TokenExpiredError") {
        res.statusCode = 401;
        res.setHeader("Content-Type", "application/json");
        return res.end(JSON.stringify({ message: "Token expired" }));
      } else {
        res.statusCode = 403;
        res.setHeader("Content-Type", "application/json");
        return res.end(JSON.stringify({ message: "Invalid token" }));
      }
    }
    req.user = user;
    next();
  });
}

module.exports = { authenticateAccessToken, authorizeRole };