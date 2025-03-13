// Example using the http module

// 1. Import the http module
const http = require("http");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const { connectDB, client } = require("./config/db");
const { setUserSchema } = require("./models/userSchema");

const hostname = process.env.HOSTNAME;
const port = process.env.PORT || 3000;

async function main() {
  try {
    await connectDB();
    await setUserSchema();

    // 3. Create a server instance
    const server = http.createServer(async (req, res) => {

      if (req.url === "/register" && req.method === "POST") {
        authRoutes.handleRegister(req, res);
      }
      else if (req.url === "/login" && req.method === "POST") {
        authRoutes.handleLogin(req, res);
      }
      else if (req.url === "/users" && req.method === "GET") {
        userRoutes.handleGetAllUsers(req, res);
      }
      else if (req.url === "/user" && req.method === "GET") {
        userRoutes.handleGetUserByEmail(req, res);
      }
      else if (req.url === "/users" && req.method === "DELETE") {
        userRoutes.handleDeleteUsers(req, res);
      }
      else if (req.url.startsWith("/users/query") && req.method === "DELETE") {
        userRoutes.handleDeleteUsersByQuery(req, res);
      }
      else if (req.url.startsWith("/users/") && req.method === "DELETE") {
        userRoutes.handleDeleteUser(req, res);
      }
      else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Not Found' }));
      }
    });

    // 6. Start the server and listen on the specified port
    server.listen(port, hostname, () => {
      console.log(`Server listening on port http://${hostname}:${port}/`);
    });
  } catch (error) {
    console.error("Application error:", error);
  }
}

main();

process.on('SIGINT', async () => {
    console.log('Closing MongoDB connection...');
    await client.close();
    process.exit();
});