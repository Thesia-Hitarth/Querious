import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import { rateLimit } from "express-rate-limit";

import userRoutes from "./routes/users.js";
import questionRoutes from "./routes/Questions.js";
import answerRoutes from "./routes/Answers.js";
import notificationRoutes from "./routes/Notifications.js";
import connectDB from "./connectMongoDb.js";
import { initSocket } from "./utils/notificationHelper.js";
import { logger } from "./utils/logger.js";

dotenv.config();
connectDB();
const app = express();

app.use(helmet());
app.use(mongoSanitize());


app.use(express.json({ limit: "30mb", extended: true }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));
app.use(cors());

// Rate limiters
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: process.env.NODE_ENV === "production" ? 100 : 10000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 10 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts, please try again later." },
});

// Apply rate limits
app.use("/user/login", authLimiter);
app.use("/user/signup", authLimiter);
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

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  },
});

initSocket(io);

if (process.env.NODE_ENV !== "test") {
  server.listen(PORT, () => {
    console.log(`server running on port ${PORT}`);
  });
}

export default app;
