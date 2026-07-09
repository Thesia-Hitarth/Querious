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
import morgan from "morgan";

import userRoutes from "./routes/users.js";
import questionRoutes from "./routes/Questions.js";
import answerRoutes from "./routes/Answers.js";
import notificationRoutes from "./routes/Notifications.js";
import flagRoutes from "./routes/flags.js";
import suggestedEditRoutes from "./routes/suggestedEdits.js";
import adminRoutes from "./routes/admin.js";
import { initSocket } from "./utils/notificationHelper.js";
import { logger } from "./utils/logger.js";
import { seedBadges } from "./utils/badgeSeeder.js";

// Cached connection handler for serverless efficiency
let cached = global._mongoose;
if (!cached) {
  cached = global._mongoose = { conn: null, promise: null };
}

export async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }
  if (!cached.promise) {
    const mongoUrl = process.env.CONNECTION_URL || process.env.MONGO_URL;
    if (!mongoUrl) {
      throw new Error("MONGO_URL or CONNECTION_URL is not defined in environment variables");
    }
    cached.promise = mongoose.connect(mongoUrl, { maxPoolSize: 10 }).then((m) => m);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

if (process.env.NODE_ENV !== "test") {
  if (process.env.MONGO_URL && !process.env.CONNECTION_URL) {
    console.warn("DEPRECATION WARNING: MONGO_URL environment variable is set. Please use CONNECTION_URL instead.");
  }
  dbConnect()
    .then((conn) => {
      console.log(`MongoDB connected: ${conn.connection.host}`);
      seedBadges();
    })
    .catch((error) => console.error("MongoDB connection failed:", error));
}

const app = express();
app.set('trust proxy', 1);

app.use(morgan("dev"));

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", "http://localhost:5000", "ws://localhost:5000", "wss://*", "https://*.vercel.app"],
        imgSrc: ["'self'", "data:", "https://images.unsplash.com", "https://lh3.googleusercontent.com", "https://*.vercel.app"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
  })
);
app.use(mongoSanitize());

app.use(async (req, res, next) => {
  if (process.env.NODE_ENV === "test") {
    return next();
  }
  try {
    await dbConnect();
    next();
  } catch (error) {
    next(error);
  }
});

app.use(express.json({ limit: "100kb", extended: true }));
app.use(express.urlencoded({ limit: "100kb", extended: true }));
const clientUrl = process.env.CLIENT_URL || process.env.REACT_APP_CLIENT_URL || "http://localhost:3000";
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
app.use("/user/reset-password", authLimiter);
app.use(generalLimiter);

// Routes
app.use("/user", userRoutes);
app.use("/questions", questionRoutes);
app.use("/answer", answerRoutes);
app.use("/notifications", notificationRoutes);
app.use("/flags", flagRoutes);
app.use("/suggested-edits", suggestedEditRoutes);
app.use("/admin", adminRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || "Internal server error";

  logger.error("Unhandled server exception caught by global boundary:", err);

  res.status(statusCode).json({
    message,
    error: {
      status: statusCode,
      message,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    }
  });
});

const PORT = process.env.PORT || 5000;

if (!process.env.VERCEL && process.env.NODE_ENV !== "test") {
  const server = app.listen(PORT, () => {
    console.log(`server running on port ${PORT}`);
  });

  const io = new Server(server, {
    cors: {
      origin: clientUrl.split(",").map((url) => url.trim()),
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      credentials: true,
    },
  });

  initSocket(io);
}

export default app;
