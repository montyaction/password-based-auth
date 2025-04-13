// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.statusCode = 401;
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify({ message: "Authentication required" }));
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      // err will contain information about the error, including expiration
      console.error("Token verification error:", err.message); // Log the specific error
      
      if (err.name === 'TokenExpiredError') {
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

module.exports = { authenticateToken };