// server.js
const http = require("http");
const { authRoutes } = require("./routes/authRoutes");
const { userRoutes } = require("./routes/userRoutes");
const dotenv = require("dotenv");
dotenv.config();
const { connectDB, closeDB, client } = require("./config/db");
const { setUserSchema } = require("./models/userSchema");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger.js");

const hostname = process.env.HOSTNAME || "localhost";
const port = process.env.PORT || 3000;

async function main() {
  try {
    await connectDB();
    await setUserSchema();

    const server = http.createServer(async (req, res) => {
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
        if (req.url === "/api-docs") {
          // Server the Swagger UI HTML
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
  }
}

main();

process.on("SIGINT", async () => {
  console.log("Closing MongoDB connection...");
  await closeDB();
  process.exit();
});
