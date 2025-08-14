const {
  getUsers,
  updateUser,
  findUserById,
  deleteUser,
  deleteUserById,
  deleteUsersByIds,
  deleteUsersByQuery,
} = require("../models/userModel.js");
const {
  authenticateAccessToken,
  authorizeRole,
} = require("../middlewares/authMiddleware.js");
const { getUserByEmailId } = require("../controllers/userController.js");
const jwt = require("jsonwebtoken");
const { URL } = require("url");

/**
 * Sends a JSON response with consistent headers and error handling.
 */
function sendResponse(res, statusCode, data, error) {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  if (error) {
    console.error(error);
    data = { message: data, error: error.message };
  }
  res.end(JSON.stringify(data));
}

/**
 * Handles errors in asynchronous route handlers.
 */
function handleAsyncError(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      sendResponse(res, 500, "Internal server error", error);
    }
  };
}

/**
 * GET /user - Requires email in the body.
 */
const handleGetUser = handleAsyncError(async (req, res) => {
  const email = req.body.email;
  if (!email) {
    return sendResponse(res, 400, { message: "Email is required" });
  }
  const user = await getUserByEmailId(email);
  if (!user) {
    return sendResponse(res, 404, { message: "User not found" });
  }
  sendResponse(res, 200, user);
});

/**
 * GET /users - Handles advanced queries with query parameters.
 */
const handleGetUsers = handleAsyncError(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const queryParams = parsedUrl.searchParams;

  const query = queryParams.get("query");
  const limit = parseInt(queryParams.get("limit"), 10) || 5;
  const page = parseInt(queryParams.get("page"), 10) || 1;
  const sort = queryParams.get("sort");
  const order = queryParams.get("order") || "asc";

  const users = await getUsers({ query, limit, page, sort, order });
  sendResponse(res, 200, users);
});
handleGetUsers.middleware = [
  authenticateAccessToken,
  authorizeRole(["admin", "editor"]),
];

/**
 * PUT /users/:id - Requires access token and user ID.
 */
const handleUpdateUser = handleAsyncError(async (req, res) => {
  const userId = req.params.id;
  const updatedUser = req.body;

  if (!userId) {
    return sendResponse(res, 400, { message: "User ID is required" });
  }
  if (!updatedUser || Object.keys(updatedUser).length === 0) {
    return sendResponse(res, 400, { message: "Updated user data is required" });
  }

  const result = await updateUser(userId, updatedUser);
  if (!result) {
    return sendResponse(res, 404, { message: "User not found" });
  }
  sendResponse(res, 200, { message: "User updated successfully", result });
});
handleUpdateUser.middleware = [authenticateAccessToken];

/**
 * DELETE /users - Requires access token.
 */
const handleDeleteUser = handleAsyncError(async (req, res) => {
  const result = await deleteUser();
  if (!result) {
    return sendResponse(res, 404, { message: "Users not found" });
  }
  sendResponse(res, 200, { message: "All users deleted" });
});
handleDeleteUser.middleware = [authenticateAccessToken];

/**
 * DELETE /users/:id - Requires access token and user ID.
 */
const handleDeleteUserById = handleAsyncError(async (req, res) => {
  const userId = req.params.id;
  if (!userId) {
    return sendResponse(res, 400, { message: "User ID is required" });
  }
  const result = await deleteUserById(userId);
  if (!result) {
    return sendResponse(res, 404, { message: "User not found" });
  }
  sendResponse(res, 200, { message: "User deleted successfully", result });
});
handleDeleteUserById.middleware = [authenticateAccessToken];

/**
 * DELETE /users/query?query={...} - Requires access token.
 */
const handleDeleteUsersByQuery = handleAsyncError(async (req, res) => {
  const queryParam = req.url.split("?query=")[1];
  if (!queryParam) {
    return sendResponse(res, 400, { message: "Query parameter is required" });
  }
  try {
    const query = JSON.parse(decodeURIComponent(queryParam));
    const result = await deleteUsersByQuery(query);
    if (!result) {
      return sendResponse(res, 404, { message: "Users not found" });
    }
    sendResponse(res, 204, { message: "Users deleted successfully" });
  } catch (error) {
    return sendResponse(res, 400, { message: "Invalid query format" });
  }
});
handleDeleteUsersByQuery.middleware = [authenticateAccessToken];

/**
 * GET /user/me - Requires access token.
 */
const handleGetCurrentUser = handleAsyncError(async (req, res) => {
  let userId;
  if (req.headers.authorization) {
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      return sendResponse(res, 401, {
        message: "Authorization header is missing or invalid",
      });
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      userId = decoded.userId;
    } catch (jwtErr) {
      return sendResponse(res, 401, {
        message: "Invalid or expired token",
        error: jwtErr.message,
      });
    }
  } else if (req.headers.cookie) {
    const cookies = req.headers.cookie.split("; ").reduce((acc, cookie) => {
      const [name, value] = cookie.split("=").map((c) => c.trim());
      if (name) acc[name] = value;
      return acc;
    }, {});
    const token = cookies.accessToken;
    if (!token) {
      return sendResponse(res, 401, {
        message: "Access token is missing from cookies",
      });
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.userId;
    } catch (jwtErr) {

      return sendResponse(res, 401, {
        message: "Invalid or expired token",
        error: jwtErr.message,
      });
    }
  } else {
    return sendResponse(res, 401, {
      message: "User not authenticated: No token or cookie found",
    });
  }

  const user = await findUserById(userId);
  if (!user) {
    return sendResponse(res, 404, { message: "User not found" });
  }

  const { password, ...userData } = user;
  sendResponse(res, 200, userData);
});
handleGetCurrentUser.middleware = [authenticateAccessToken];

function userRoutes(req, res) {
  const routes = [
    { path: "/user", method: "GET", handler: handleGetUser },
    { path: "/users", method: "GET", handler: handleGetUsers },
    { path: "/users/:id", method: "PUT", handler: handleUpdateUser },
    { path: "/users", method: "DELETE", handler: handleDeleteUser },
    { path: "/users/:id", method: "DELETE", handler: handleDeleteUserById },
    { path: "/users/query", method: "DELETE", handler: handleDeleteUsersByQuery },
    { path: "/user/me", method: "GET", handler: handleGetCurrentUser },
  ];
  // { path: "/users/search", method: "GET", handler: handleUsersSearch },
  // { path: "/users/search", method: "GET", handler: handleUsersFilter },

  const matchedRoute = routes.find((route) => {
    const pathRegex = new RegExp(
      `^${route.path.replace(/:\w+/g, "([\\w-]+)")}$`
    );
    const match = pathRegex.exec(req.url);
    if (match && route.method === req.method) {
      if (route.path.includes(":")) {
        const paramNames = route.path.match(/:\w+/g).map((p) => p.slice(1));
        const paramValues = match.slice(1);
        req.params = paramNames.reduce((obj, name, index) => {
          obj[name] = paramValues[index];
          return obj;
        }, {});
      }
      return true;
    } else if (
      route.path === "/users" &&
      route.method === "GET" &&
      req.url.startsWith("/users")
    ) {
      // Handle /users with query parameters
      return true;
    }
    return false;
  });

  console.log(matchedRoute);

  if (matchedRoute) {
    // Apply middleware if any
    if (matchedRoute.handler.middleware) {
      const middlewareChain = [...matchedRoute.handler.middleware];
      const next = () => {
        if (middlewareChain.length > 0) {
          const middleware = middlewareChain.shift();
          middleware(req, res, next);
        } else {
          matchedRoute.handler(req, res);
        }
      };
      next();
    } else {
      matchedRoute.handler(req, res);
    }
  } else {
    sendResponse(res, 404, { message: "Not Found" });
  }
}

module.exports = { userRoutes };
