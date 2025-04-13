// server.js
const http = require("http");
const { authRoutes } = require("./routes/authRoutes");
const { userRoutes } = require("./routes/userRoutes");
const dotenv = require("dotenv");
dotenv.config();
const { connectDB, closeDB, client } = require("./config/db");
const { setUserSchema } = require("./models/userSchema");

const hostname = process.env.HOSTNAME;
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
        if (req.url.startsWith("/user")) {
          userRoutes(req, res);
        } else {
          authRoutes(req, res);
        }
      });
    });

    server.listen(port, hostname, () => {
      console.log(`Server listening on port http://${hostname}:${port}/`);
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