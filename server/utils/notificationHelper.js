import Notification from "../models/Notifications.js";

let ioInstance = null;
export const userSocketMap = new Map();

export const initSocket = (io) => {
  ioInstance = io;
  io.on("connection", (socket) => {
    socket.on("join", (userId) => {
      userSocketMap.set(String(userId), socket.id);
    });

    socket.on("disconnect", () => {
      for (const [userId, socketId] of userSocketMap.entries()) {
        if (socketId === socket.id) {
          userSocketMap.delete(userId);
          break;
        }
      }
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

    const socketId = userSocketMap.get(String(userId));
    if (socketId && ioInstance) {
      ioInstance.to(socketId).emit("notification", newNotif);
    }
  } catch (error) {
    console.error("Error sending notification:", error);
  }
};
