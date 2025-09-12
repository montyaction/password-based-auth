// server.js
const http = require("http");
const { authRoutes } = require("./routes/authRoutes");
const { userRoutes } = require("./routes/userRoutes");
const dotenv = require("dotenv");
dotenv.config();
const { connectDB, closeDB } = require("./config/db");
const { setUserSchema } = require("./models/userSchema");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger.js");

const hostname = process.env.HOST_NAME || "localhost";
const port = process.env.PORT || 3000;

// Security headers to add to all responses
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'"
};

async function main() {
  try {
    await connectDB();
    await setUserSchema();

    const server = http.createServer(async (req, res) => {
      // Add security headers to all responses
      Object.entries(securityHeaders).forEach(([header, value]) => {
        res.setHeader(header, value);
      });

      // Handle CORS
      res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS || '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      // Parse request body
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", async () => {
        try {
          if (req.headers["content-type"] === "application/json") {
            try {
              req.body = JSON.parse(body);
            } catch (error) {
              console.error("JSON parsing error:", error);
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ success: false, message: "Invalid JSON" }));
              return;
            }
          } else {
            req.body = body; // For form data or other types
          }

          // Route requests
          if (req.url === "/api-docs") {
            // Serve the Swagger UI HTML
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(swaggerUi.generateHTML(swaggerSpec));
          } else if (req.url.startsWith("/api-docs/")) {
            // Serve Swagger UI static assets
            const filePath = req.url.replace("/api-docs", "");
            swaggerUi.serve(req, res, () => {
              res.writeHead(404, { "Content-Type": "text/plain" });
              res.end("Not Found");
            });
          } else if (req.url.startsWith("/user")) {
            userRoutes(req, res);
          } else {
            authRoutes(req, res);
          }
        } catch (error) {
          console.error("Request handling error:", error);
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({
            success: false,
            message: "Internal server error"
          }));
        }
      });
    });

    server.listen(port, hostname, () => {
      console.log(`Server listening on port http://${hostname}:${port}/`);
      console.log(
        `API documentation available at http://${hostname}:${port}/api-docs`
      );
    });
  } catch (error) {
    console.error("Application error:", error);
    process.exit(1);
  }
}

main();

process.on("SIGINT", async () => {
  console.log("Closing MongoDB connection...");
  await closeDB();
  process.exit();
});
