import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });


if (!process.env.JWT_SECRET || !(process.env.CONNECTION_URL || process.env.MONGO_URL)) {
  throw new Error("Critical environment variables (JWT_SECRET and CONNECTION_URL/MONGO_URL) are missing.");
}

import dns from "dns";

try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {
  console.warn("Could not set DNS servers, using defaults:", e.message);
}

dns.setDefaultResultOrder("ipv4first");

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import http from "http";
import { Server } from "socket.io";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import { rateLimit } from "express-rate-limit";

import userRoutes from "./routes/users.js";
import questionRoutes from "./routes/Questions.js";
import answerRoutes from "./routes/Answers.js";
import notificationRoutes from "./routes/Notifications.js";
import { initSocket } from "./utils/notificationHelper.js";
import { logger } from "./utils/logger.js";

// Ensure Mongo connects using CONNECTION_URL
const mongoUrl = process.env.CONNECTION_URL || process.env.MONGO_URL;
if (mongoUrl) {
  mongoose
    .connect(mongoUrl)
    .then((conn) => console.log(`MongoDB connected: ${conn.connection.host}`))
    .catch((error) => console.error("MongoDB connection failed:", error));
} else {
  console.warn("WARNING: CONNECTION_URL not defined. MongoDB connection skipped.");
}

const app = express();
app.set('trust proxy', 1);

app.use(helmet());
app.use(mongoSanitize());

app.use(express.json({ limit: "100kb", extended: true }));
app.use(express.urlencoded({ limit: "100kb", extended: true }));
const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
app.use(
  cors({
    origin: clientUrl.split(",").map((url) => url.trim()),
    credentials: true,
  })
);

// Rate limiters
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: process.env.NODE_ENV === "production" ? 100 : 10000,
  validate: { xForwardedForHeader: false },
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 10 : 1000,
  validate: { xForwardedForHeader: false },
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts, please try again later." },
});

// Apply rate limits
app.use("/user/login", authLimiter);
app.use("/user/signup", authLimiter);
app.use("/user/forgot-password", authLimiter);
app.use(generalLimiter);

// Routes
app.use("/user", userRoutes);
app.use("/questions", questionRoutes);
app.use("/answer", answerRoutes);
app.use("/notifications", notificationRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  logger.error("Unhandled server exception caught by global boundary:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});

const PORT = process.env.PORT || 5000;

if (!process.env.VERCEL && process.env.NODE_ENV !== "test") {
  const server = app.listen(PORT, () => {
    console.log(`server running on port ${PORT}`);
  });

  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    },
  });

  initSocket(io);
}

export default app;
