const { ObjectId } = require("mongodb");
const { connectDB } = require("../config/db");

let database = null;

async function getDatabase() {
  if (!database) {
    database = await connectDB();
  }
  return database;
}

async function createUser(userData) {
  const db = await getDatabase();
  const now = new Date();

  // Add createdAt and updateAt fields
  userData.createdAt = now;
  userData.updatedAt = now;

  try {
    const result = await db.collection("users").insertOne(userData);
    return {
      valid: true,
      message: "User registered succefully! ",
      insertID: result.insertedId,
    };
  } catch (error) {
    console.log("Error creating user:", error);
    return { valid: false, message: "Registration failed" };
  }
}

async function findUserByEmail(email) {
  const db = await getDatabase();
  return db.collection("users").findOne({ email });
}

async function getUsers() {
  const db = await getDatabase();
  return db.collection("users").find({}).toArray();
}

async function deleteUser() {
  const db = await getDatabase();
  return db.collection("users").deleteOne();
}

async function deleteUserById(userId) {
  const db = await getDatabase();
  return db.collection("users").deleteOne({ _id: new ObjectId(userId) });
}

async function deleteUserByIds(userIds) {
  const db = await getDatabase();
  try {
    const objectIds = userIds.map((id) => new ObjectId(id));
    const result = await db
      .collection("users")
      .deleteMany({ _id: { $in: objectIds } });
    return result;
  } catch (error) {
    console.error("Error deleting users:", error);
    throw error;
  }
}

async function deleteUserByQuery(query) {
  const db = await getDatabase();
  try {
    const result = await db.collection("users").deleteMany(query);
    return result;
  } catch (error) {
    console.error("Error deleting users by query:", error);
    throw error;
  }
}

module.exports = {
  createUser,
  findUserByEmail,
  getUsers,
  deleteUser,
  deleteUserById,
  deleteUserByIds,
  deleteUserByQuery,
};