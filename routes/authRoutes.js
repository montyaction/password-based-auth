// routes/authRoutes.js
const authController = require("../controllers/authController");

async function handleRegister(req, res) {
    try {
      const result = await authController.registerUser(req.body);

      res.statusCode = result.valid ? 201 : 400;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          message: "Data received",
          body: req.body,
          resData: result,
        })
      );
    } catch (error) {
      // console.log("Received body (non-JSON):", body);
      console.error(error);

      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ valid: false, message: "Invalid JSON" }));
    }
}

async function handleLogin(req, res) {
  try {
    const result = await authController.loginUser(req.body);
    res.writeHead(result.valid ? 200 : 401, {
      "Content-Type": "application/json",
    });
    res.end(JSON.stringify(result));
  } catch (error) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ valid: false, message: "Invalid request" }));
  }
}

function authRoutes(req, res) {
  if (req.url === "/register" && req.method === "POST") {
    handleRegister(req, res);
  } else if (req.url === "/login" && req.method === "POST") {
    handleLogin(req, res);
  } else {
    res.statusCode = 404;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ message: "Not Found from auth routes" }));
  }
}

module.exports = { authRoutes };
