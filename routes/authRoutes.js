// routes/authRoutes.js
const {
  registerUserController,
  loginUserController,
  verifyEmailController,
  refreshTokenController
} = require("../controllers/authController");
const url = require("url");
const { sendSuccess, sendError } = require("../utils/responseHandler");

async function handleRegister(req, res) {
  try {
    const result = await registerUserController(req.body);

    if (result.valid) {
      sendSuccess(res, 201, "User registered successfully! Please check your email");
    } else {
      sendError(res, 400, result.message);
    }
  } catch (error) {
    sendError(res, 500, "Registration failed", error);
  }
}

async function handleLogin(req, res) {
  try {
    const result = await loginUserController(req.body);

    if (result.valid) {
      sendSuccess(res, 200, "Login successful", {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user
      });
    } else {
      sendError(res, 401, result.message);
    }
  } catch (error) {
    sendError(res, 500, "Login failed", error);
  }
}

async function handleVerifyEmail(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const token = parsedUrl.query.token;

  if (!token) {
    return sendError(res, 400, "Verification token is missing");
  }

  try {
    const result = await verifyEmailController(token);

    if (result.valid) {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end("<h1>Email verified successfully!</h1><p>You can now log in to your account.</p>");
    } else {
      sendError(res, 400, result.message);
    }
  } catch (error) {
    sendError(res, 500, "Email verification failed", error);
  }
}

async function handleRefreshToken(req, res) {
  try {
    const result = await refreshTokenController(req.body.refreshToken);

    if (result.valid) {
      sendSuccess(res, 200, "Token refreshed successfully", {
        accessToken: result.accessToken
      });
    } else {
      sendError(res, 401, result.message);
    }
  } catch (error) {
    sendError(res, 500, "Token refresh failed", error);
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
  } else if (pathname === "/refresh-token" && req.method === "POST") {
    handleRefreshToken(req, res);
  } else {
    sendError(res, 404, "Auth endpoint not found", {
      availableEndpoints: [
        "POST /register",
        "POST /login",
        "GET /verify-email?token=VERIFICATION_TOKEN",
        "POST /refresh-token"
      ]
    });
  }
}

module.exports = { authRoutes };
