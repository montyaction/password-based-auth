const { ObjectId } = require("mongodb");
const { connectDB } = require("../config/db");

let database = null;

/**
 * Retrieves the database connection.  Implements the Singleton pattern
 * to ensure only one connection is ever made.
 *
 * @returns {Promise<MongoDB.Db>} The database connection.
 */
async function getDatabase() {
  if (!database) {
    database = await connectDB();
  }
  return database;
}

/**
 * Handles common database operations with error handling and logging.
 * @param {string} collectionName - The name of the collection.
 * @param {string} operationName - The name of the database operation to perform (e.g., 'findOne', 'updateOne').
 * @param {object} query - The query for the operation.
 * @param {object} options - Additional options for the operation.
 * @param {object} data - Data for operations like insertOne or updateOne
 * @param {string} errorMessage - Custom error message.
 * @returns {Promise<any>} -  The result of the database operation, or null on error.
 */
async function handleDatabaseOperation(
  collectionName,
  operationName,
  query,
  options = {},
  data = {}, // Added data parameter
  errorMessage = "Database operation failed"
) {
  const db = await getDatabase();
  const collection = db.collection(collectionName);
  let operation;

  switch (operationName) {
    case "findOne":
      operation = collection.findOne.bind(collection, query, options);
      break;
    case "updateOne":
      operation = collection.updateOne.bind(collection, query, data, options); // Pass data
      break;
    case "updateMany":
      operation = collection.updateMany.bind(collection, query, data, options);
      break;
    case "deleteMany":
      operation = collection.deleteMany.bind(collection, query, options);
      break;
    case "deleteOne":
      operation = collection.deleteOne.bind(collection, query, options);
      break;
    case "insertOne":
      operation = collection.insertOne.bind(collection, data, options);
      break;
    case "find":
      operation = collection.find.bind(collection, query, options);
      break;
    case "countDocuments":
      operation = collection.countDocuments.bind(collection, query, options);
      break;
    default:
      throw new Error(`Unsupported operation: ${operationName}`);
  }

  try {
    const result = await operation();
    return result;
  } catch (error) {
    console.error(`${errorMessage}:`, error);
    return null;
  }
}

/**
 * Creates a new user.
 *
 * @param {object} userData - The user data to create.
 * @returns {Promise<object>} - An object indicating the success of the operation.
 */
async function createUser(userData) {
  const db = await getDatabase();
  const collection = db.collection("users");
  const now = new Date();
  const user = {
    ...userData,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const result = await collection.insertOne(user);
    return {
      valid: true,
      message: "User registered successfully! Please check your email",
      insertedId: result.insertedId,
    };
  } catch (error) {
    console.error("Error creating user:", error);
    return { valid: false, message: "Registration failed" }; // Consistent return
  }
}

/**
 * Updates a user's data by ID, ensuring all required fields are present.
 *
 * @param {string} id - The ID of the user to update.
 * @param {object} data - The data to update.  This *can* be a partial update.
 * @returns {Promise<object>} - The result of the update operation.
 */
async function updateUser(id, data) {
  try {
    // 1. Fetch the existing user data using handleDatabaseOperation
    const existingUser = await handleDatabaseOperation(
      "users",
      "findOne",
      { _id: new ObjectId(id) },
      {},
      {},
      "Error finding user for update"
    );

    if (!existingUser) {
      return null;
    }

    // 2. Merge the new data with the existing data, ensuring *all* required fields are present
    const updatedUserData = {
      first_name:
        data.first_name !== undefined
          ? data.first_name
          : existingUser.first_name,
      last_name:
        data.last_name !== undefined ? data.last_name : existingUser.last_name,
      age: data.age !== undefined ? data.age : existingUser.age,
      email: data.email !== undefined ? data.email : existingUser.email,
      password:
        data.password !== undefined ? data.password : existingUser.password,
      role: data.role !== undefined ? data.role : existingUser.role,
      isVerified:
        data.isVerified !== undefined
          ? data.isVerified
          : existingUser.isVerified,
      verificationToken:
        data.verificationToken !== undefined
          ? data.verificationToken
          : existingUser.verificationToken,
      updatedAt: new Date(), // Always update updatedAt
      createdAt: existingUser.createdAt, // Keep original createdAt
    };

    // 3. Remove _id
    delete updatedUserData._id;

    // 4. Log the data before the update
    console.log("updatedUserData before updateOne:", updatedUserData);

    // 5. Use handleDatabaseOperation with "updateOne"
    const result = await handleDatabaseOperation(
      "users",
      "updateOne",
      { _id: new ObjectId(id) },
      {},
      { $set: updatedUserData },
      "Error updating user"
    );
    return result;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
}

/**
 * Finds a user by their verification token.
 *
 * @param {string} token - The verification token.
 * @returns {Promise<object|null>} - The user object or null if not found.
 */
async function findUserByVerificationToken(token) {
  return handleDatabaseOperation(
    "users",
    "findOne",
    { verificationToken: token },
    {},
    {},
    "Error finding user by verification token"
  );
}

/**
 * Finds a user by their email address.
 *
 * @param {string} email - The email address.
 * @returns {Promise<object|null>} - The user object or null if not found.
 */
async function findUserByEmail(email) {
  return handleDatabaseOperation(
    "users",
    "findOne",
    { email: email },
    {},
    {},
    "Error finding user by email"
  );
}

/**
 * Finds a user by their ID.
 *
 * @param {string} id - The ID of the user.
 * @returns {Promise<object|null>} - The user object or null if not found.
 */
async function findUserById(id) {
  try {
    return handleDatabaseOperation(
      "users",
      "findOne",
      { _id: new ObjectId(id) },
      {},
      {},
      "Error finding user by ID"
    );
  } catch (error) {
    return null; //handles invalid object ID, consistent with original code
  }
}

/**
 * Retrieves users from the database with optional filtering, sorting,
 * pagination, and full-text search.
 *
 * @param {object} options - An object containing query parameters.
 * @param {string} [options.query] - A full-text search query string.
 * @param {object} [options.filter] - An object containing key-value pairs for filtering.
 * @param {number} [options.limit] - The maximum number of users to return per page.
 * @param {number} [options.page] - The page number to retrieve (for pagination).
 * @param {string} [options.sort] - The field to sort by (e.g., 'name', 'age').
 * @param {string} [options.order] - The sort order ('asc' or 'desc').
 *
 * @returns {Promise<object>} - A promise that resolves to an object containing:
 * - `users`: An array of user objects.
 * - `total`: The total number of users matching the query (for pagination metadata).
 */
async function getUsers(options = { limit: 5 }) {
  const db = await getDatabase();
  const collection = db.collection("users");

  let {
    query,
    filter = {},
    limit = 5,
    page = 1,
    sort,
    order = "asc",
  } = options;
  const findOptions = {};

  // 1. Full-Text Search (using $text index)
  if (query) {
    filter.$text = { $search: query };
  }

  // 2. Filtering (for any field)
  for (const key in filter) {
    if (filter.hasOwnProperty(key)) {
      if (key === "active") {
        filter.isVerified = filter[key] === "true" || filter[key] === true;
        delete filter[key];
      }
    }
  }

  // 3. Sorting
  if (sort) {
    const sortDirection = order === "desc" ? -1 : 1;
    findOptions.sort = { [sort]: sortDirection };
  }

  // 4. Pagination
  let skip = 0;
  if (limit > 0) {
    skip = (page - 1) * limit;
    findOptions.limit = limit;
  }

  // 5. Execute the query
  try {
    const cursor = collection.find(filter, findOptions).skip(skip);
    if (limit > 0) {
      cursor.limit(limit);
    }
    if (sort) {
      cursor.sort(findOptions.sort);
    }
    const users = await cursor.toArray();
    const total = await collection.countDocuments(filter);
    return {
      users,
      total,
      page,
      limit,
      totalPages: limit > 0 ? Math.ceil(total / limit) : 1,
    };
  } catch (error) {
    console.error("Error retrieving users:", error);
    throw error; // Re-throw the error for the caller to handle
  }
}

/**
 * Deletes users from the database based on a query.
 *
 * @param {object} query - The query object to use for deletion.
 * @returns {Promise<object>} - A promise that resolves to the result of the deleteMany operation.
 */
async function deleteUsersByQuery(query) {
  return handleDatabaseOperation(
    "users",
    "deleteMany",
    query,
    {}, // No options
    {},
    "Error deleting users by query"
  );
}

/**
 * Deletes all users from the database.
 *
 * @returns {Promise<object>} - A promise that resolves to the result of the deleteMany operation.
 */
async function deleteAllUsers() {
  return handleDatabaseOperation(
    "users",
    "deleteMany",
    {},
    {},
    {},
    "Error deleting all users"
  );
}

/**
 * Deletes a user by their ID.
 *
 * @param {string} id - The ID of the user to delete.
 * @returns {Promise<object>} - A promise that resolves to the result of the deleteOne operation.
 */
async function deleteUserById(id) {
  try {
    return handleDatabaseOperation(
      "users",
      "deleteOne",
      { _id: new ObjectId(id) },
      {},
      {},
      "Error deleting user by ID"
    );
  } catch (error) {
    return null; //handles invalid object ID, consistent with original
  }
}

/**
 * Deletes users by their IDs.
 *
 * @param {string[]} userIds - An array of user IDs to delete.
 * @returns {Promise<object>} - A promise that resolves to the result of the deleteMany operation.
 */
async function deleteUsersByIds(userIds) {
  const objectIds = userIds.map((id) => new ObjectId(id));
  return handleDatabaseOperation(
    "users",
    "deleteMany",
    { _id: { $in: objectIds } },
    {},
    {},
    "Error deleting users by IDs"
  );
}

module.exports = {
  createUser,
  updateUser,
  findUserByEmail,
  findUserByVerificationToken,
  findUserById,
  getUsers,
  deleteAllUsers, // Added deleteAllUsers
  deleteUserById,
  deleteUsersByIds,
  deleteUsersByQuery,
};
