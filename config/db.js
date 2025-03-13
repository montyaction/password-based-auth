const { MongoClient, ServerApiVersion } = require("mongodb");
require('dotenv').config();

const mongoURI = process.env.MONGO_URI;
const MONGO_DB_NAME = process.env.MONGO_DB_NAME;

// Create a MongoClient with a MongoClientOPtions object to set the Stable API version
const client = new MongoClient(mongoURI, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

let db = null;

async function connectDB() {
    try {
      if (!db) {
        // Connect the client to the server
        await client.connect();
        console.log("✅ Connected to MongoDB Atlas successfully!");
  
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB");
  
        db = client.db(MONGO_DB_NAME);
      }
      return db;
    } catch (error) {
        console.error("❌ MongoDB connection error:", error);
        process.exit(1);
    }
};

module.exports = { connectDB, client };