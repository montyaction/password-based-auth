// api/index.js

const { authRoutes } = require("../routes/authRoutes");
const { userRoutes } = require("../routes/userRoutes");
const dotenv = require("dotenv");
dotenv.config();
const { connectDB } = require("../config/db");
const { setUserSchema } = require("../models/userSchema");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("../swagger.js");

// This flag ensures the database connection and schema setup only run once
let isDbConnected = false;

// Helpler function to tun a series of middleware
function runMiddleware(req, res, middleware, callback) {
  const next = () => {
    if (middleware.length > 0) {
      const nextMiddleware = middleware.shift();
      nextMiddleware(req, res, next);
    } else {
      callback();
    }
  };
  next();
}

// Vercel exports a single function to handle requests
module.exports = async (req, res) => {
  // Connect to the database and set the sachema only once
  if (!isDbConnected) {
    try {
      await connectDB();
      await setUserSchema();
      isDbConnected = true;
      console.log("MongoDB  connection and schema serup complete.");
    } catch (error) {
      console.error("Failed to connect to DB:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Internal sever error during setup" }));
      return;
    }
  }
};

// Set CORS headers for all responses
res.setHeader("Access-Control-Allow-Origin", "*");
res.setHeader(
  "Access-Control-Allow-Methods",
  "GET, POST, PUT, DELETE, OPTIONS"
);
res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

// Handle preflight requests
if (req.method === "OPTIONS") {
  res.writeHead(204);
  res.end();
  return;
}

let body = "";
req.on("data", (chunk) => {
  body += chunk.toString();
});

req.on("end", async () => {
  if (req.headers["content-type"] === "application/json") {
    try {
      req.body = JSON.parse(body);
    } catch (error) {
      console.error(error);
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Invalid JSON" }));
      return;
    }
  } else {
    req.body = body; // For form data or other types
  }
  // Main routing logic
  if (req.url === "/api-docs") {
    return runMiddleware(req, res, [...swaggerUi.serve], () => {
      swaggerUi.setup(swaggerSpec)(req, res);
    });
  }

  if (req.url.startsWith("/user")) {
    userRoutes(req, res);
  } else if (req.url.startsWith("/auth")) {
    authRoutes(req, res);
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Not Found" }));
  }
});
