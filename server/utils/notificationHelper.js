import Notification from "../models/Notifications.js";
import jwt from "jsonwebtoken";

let ioInstance = null;

export const initSocket = (io) => {
  ioInstance = io;

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error("Authentication error: Token missing"));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      return next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(String(socket.userId));

    socket.on("disconnect", () => {
      // Socket.io automatically leaves all rooms on disconnect
    });
  });
};

export const sendNotification = async (userId, message, questionId) => {
  try {
    const newNotif = new Notification({
      userId,
      message,
      questionId,
    });
    await newNotif.save();

    if (ioInstance) {
      ioInstance.to(String(userId)).emit("notification", newNotif);
    }
  } catch (error) {
    console.error("Error sending notification:", error);
  }
};
