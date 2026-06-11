import mongoose from "mongoose";
import dns from "dns";

try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {
  console.warn("Could not set DNS servers, using defaults:", e.message);
}

dns.setDefaultResultOrder("ipv4first");

const connectDB = async () => {
  const url = process.env.CONNECTION_URL || process.env.MONGO_URL;
  if (!url) {
    console.warn("WARNING: Neither CONNECTION_URL nor MONGO_URL environment variable is defined in .env. MongoDB connection skipped.");
    return;
  }
  try {
    const conn = await mongoose.connect(url);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection failed:", error);
  }
};

export default connectDB;
