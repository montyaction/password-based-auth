// routes/userRoutes.js

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
const { sendSuccess, sendError } = require("../utils/responseHandler");

/**
 * @swagger
 * tags:
 * name: Users
 * description: User management and retrieval
 */

// Sends a JSON response with consistent headers and error handling.

function sendResponse(res, statusCode, data, error) {
  if (error) {
    sendError(res, statusCode, data, error);
  } else {
    sendSuccess(
      res,
      statusCode,
      data.message || "Success",
      data.message ? null : data
    );
  }
}

// Handles errors in asynchronous route handlers.

function handleAsyncError(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      sendResponse(res, 500, "Internal server error", error);
    }
  };
}

// GET /user - Requires email in the body.

/**
 * @swagger
 * /user:
 *   get:
 *     summary: Retrieve a user by email
 *     description: Requires an email in the request body to fetch user details.
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: The email of the user to retrieve.
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Successfully retrieved user details.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: The user ID.
 *                 first_name:
 *                   type: string
 *                   description: The user's first name.
 *                 last_name:
 *                  type: string
 *                  description: The user's last name.
 *                 email:
 *                   type: string
 *                   description: The user's email.
 *       400:
 *         description: Bad request, email is missing or invalid.
 *       404:
 *        description: User not found.
 *       500:
 *         description: Internal server error.
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

// GET /users - Handles advanced queries with query parameters.

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users with advanced query support
 *     tags: [Users]
 *     description: |
 *       Retrieve all users with support for sorting, pagination, field selection.
 *       Query parameters:
 *       - **sortBy**: field to sort by (e.g., first_name)
 *       - **order**: asc | desc
 *       - **limit**: max number of results
 *       - **skip**: number of records to skip
 *       - **select**: comma-separated fields (e.g., first_name,email)
 *     parameters:
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Field to sort by
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Limit number of results
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *         description: Skip number of results
 *       - in: query
 *         name: select
 *         schema:
 *           type: string
 *         description: Fields to include (comma separated)
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   first_name:
 *                     type: string
 *                   last_name:
 *                     type: string
 *                   email:
 *                     type: string
 *       400:
 *         description: Invalid query parameters
 *       500:
 *         description: Server error
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

// PUT /users/:id - Requires access token and user ID.
/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     description: Retrieve a user by their unique ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *       400:
 *         description: Invalid ID format
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 *   put:
 *     summary: Update user by ID
 *     tags: [Users]
 *     description: Update an existing user’s data by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               email:
 *                 type: string
 *               age:
 *                 type: integer
 *               role:
 *                 type: string
 *                 enum: [user, admin, editor]
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 *   delete:
 *     summary: Delete user by ID
 *     tags: [Users]
 *     description: Delete a user by their unique ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       400:
 *         description: Invalid ID format
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
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

// DELETE /users - Requires access token.

const handleDeleteUser = handleAsyncError(async (req, res) => {
  const result = await deleteUser();
  if (!result) {
    return sendResponse(res, 404, { message: "Users not found" });
  }
  sendResponse(res, 200, { message: "All users deleted" });
});
handleDeleteUser.middleware = [authenticateAccessToken];

// DELETE /users/:id - Requires access token and user ID.

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

// DELETE /users/query?query={...} - Requires access token.
/**
 * @swagger
 * /users/query:
 *   delete:
 *     summary: Delete users by query
 *     tags: [Users]
 *     description: Delete users by a custom query object
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               role: user
 *     responses:
 *       200:
 *         description: Users deleted successfully
 *       400:
 *         description: Invalid query object
 *       500:
 *         description: Server error
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

// DELETE /users/ids - Requires access token and array of user IDs in body.

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
    {
      path: "/users/query",
      method: "DELETE",
      handler: handleDeleteUsersByQuery,
    },
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

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Users]
 *     description: Retrieve details of the currently authenticated user using the JWT token
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user details retrieved successfully
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       500:
 *         description: Server error
 */
