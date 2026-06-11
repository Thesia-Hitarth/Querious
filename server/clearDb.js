import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "dns";

try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {
  console.warn("Could not set DNS servers, using defaults:", e.message);
}

dns.setDefaultResultOrder("ipv4first");

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, ".env") });

const uri = process.env.MONGO_URL || process.env.CONNECTION_URL;

if (!uri) {
  console.error("Error: MONGO_URL or CONNECTION_URL is not defined in .env");
  process.exit(1);
}

const clearDB = async () => {
  try {
    console.log(`Connecting to database at: ${uri.replace(/:([^@]+)@/, ":*****@")}`);
    await mongoose.connect(uri);
    console.log("Connected successfully. Finding collections...");

    const collections = await mongoose.connection.db.collections();
    for (let collection of collections) {
      const countBefore = await collection.countDocuments();
      await collection.deleteMany({});
      console.log(`Cleared collection: "${collection.collectionName}" (deleted ${countBefore} documents)`);
    }

    console.log("Database cleared successfully!");
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Error clearing database:", error);
    process.exit(1);
  }
};

clearDB();
