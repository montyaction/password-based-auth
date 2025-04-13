// config/dbSetup.js
import { connectDB } from "./db";

async function createUniqueEmailIndex() {
    try {
        const db = await connectDB();
        await db.collection("users").createIndex({ email: 1 }, { unique: true });
    } catch (error) {
        if (error.code === 85) {
            console.log("Index already exists.");
        } else {
            console.error("Error creating unique index:", error);
        }
    }
}

async function setupDatabase() {
    await createUniqueEmailIndex();
}

setupDatabase();