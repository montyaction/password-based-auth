const { connectDB } = require("../config/db");

async function setUserSchema() {
  const db = await connectDB();

  try {
    await db.command({
      collMod: "users",
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: [
            "first_name",
            "last_name",
            "age",
            "email",
            "password",
            "createdAt",
            "updatedAt",
          ],
          properties: {
            _id: {
              bsonType: "objectId",
            },
            first_name: {
              bsonType: "string",
            },
            last_name: {
              bsonType: "string",
            },
            age: {
              bsonType: "int",
              minimum: 0,
            },
            email: {
              bsonType: "string",
              pattern: "^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,4}$",
            },
            password: {
              bsonType: "string",
            },
            createdAt: {
              bsonType: "date",
            },
            updatedAt: {
              bsonType: "date",
            },
          },
        },
      },
      validationLevel: "strict",
      validationAction: "error",
    });
    console.log("User schema set successfully!");
  } catch (error) {
    console.log("Error setting user schema:", error);
  }
}

module.exports = { setUserSchema };