// routes/authRoutes.js
const {
  registerUserController,
  loginUserController,
  verifyEmailController
} = require("../controllers/authController");
const url = require("url");

async function handleRegister(req, res) {
    try {
      const result = await registerUserController(req.body);

      res.statusCode = result.valid ? 201 : 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({
          message: "Data received",
          body: req.body,
          resData: result,
      }));
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
    const result = await loginUserController(req.body);
    res.writeHead(result.valid ? 200 : 401, {"Content-Type": "application/json"});
    res.end(JSON.stringify(result));
  } catch (error) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ valid: false, message: "Invalid request" }));
  }
}

async function handleVerifyEmail(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const token = parsedUrl.query.token;

  if (!token) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ message: "Verification token is missing" }));
  }

  try {
    await verifyEmailController(token);
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end("Email verified successfully! You can now log in.");
  } catch (error) {
    console.error('Email verification error:', error);
    res.writeHead(500, { "Content-Type": "application/json"});
    res.end(JSON.stringify({ message: "Internal server error during email verification."}));
  }
}

function authRoutes(req, res) {
  const { pathname } = new URL(req.url, `http://${req.headers.host}`);

  if (pathname === "/register" && req.method === "POST") {
    handleRegister(req, res);
  } else if (pathname === "/login" && req.method === "POST") {
    handleLogin(req, res);
  } else if (pathname === "/verify-email" && req.method === "GET") {
    handleVerifyEmail(req, res);
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        message: "Auth endpoint not found",
        availableEndpoints: [
          "POST /register",
          "POST /login",
          "GET /verify-email?token=VERIFICATION_TOKEN",
        ],
      })
    );
  }
}

module.exports = { authRoutes };
