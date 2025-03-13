import { configDotenv } from "dotenv";
configDotenv();

console.log(process.env.MONGODB_URI);
console.log(process.env.MONGO_URI);
