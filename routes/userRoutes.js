// routes/userRoutes.js
const {
  getUsers,
  deleteUser,
  deleteUserById,
  deleteUserByIds,
  deleteUserByQuery,
} = require("../models/userModel.js");
const { authenticateToken, authorizeRole } = require("../middlewares/authMiddleware.js");
const { getUserByEmailId } = require("../controllers/userController.js");

async function handleGetUser(req, res) {
  authenticateToken(req, res, async () => {
    try {
      const email = req.body.email;
      const user = await getUserByEmailId(email);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(user));
    } catch (error) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Internal server error" }));
    }
  });
}

async function handleGetUsers(req, res) {
  authenticateToken(req, res, () =>
    authorizeRole(['admin', 'editor'])(req, res, async () => {
      try {
        const users = await getUsers();
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(users));
      } catch (error) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Internal server error" }));
      }
    }));
}

async function handleDeleteUser(req, res) {
  authenticateToken(req, res, async () => {
    try {
      await deleteUser();
      res.writeHead(204);
      res.end();
    } catch (error) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Internal server error" }));
    }
  });
}

async function handleDeleteUserById(req, res) {
  authenticateToken(req, res, async () => {
    try {
      const userId = req.url.split("/").pop();
      const result = await deleteUserById(userId);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ result: result }));
    } catch (error) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Internal server error" }));
    }
  });
}

async function handleDeleteUsersByQuery(req, res) {
  authenticateToken(req, res, async () => {
    try {
      const query = JSON.parse(
        decodeURIComponent(req.url.split("?query=").pop())
      );
      await deleteUserByQuery(query);
      res.writeHead(204);
      res.end();
    } catch (error) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Internal server error" }));
    }
  });
}

function userRoutes(req, res) {
  if (req.url === "/user" && req.method === "GET") {
    handleGetUser(req, res);
  } else if (req.url === "/users" && req.method === "GET") {
    handleGetUsers(req, res);
  } else if (req.url === "/users" && req.method === "DELETE") {
    handleDeleteUser(req, res);
  } else if (req.url.startsWith("/users/") && req.method === "DELETE") {
    handleDeleteUserById(req, res);
  } else if (req.url.startsWith("/users/query") && req.method === "DELETE") {
    handleDeleteUsersByQuery(req, res);
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Not Found" }));
  }
}

module.exports = { userRoutes };
