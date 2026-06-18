import Notifications from "../models/Notifications.js";
import mongoose from "mongoose";

export const getNotifications = async (req, res) => {
  const userId = req.userId;
  try {
    const notifications = await Notifications.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markNotificationRead = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).send("Notification unavailable...");
  }
  try {
    const updated = await Notifications.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { $set: { read: true } },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ message: "Notification not found or unauthorized." });
    }
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markAllNotificationsRead = async (req, res) => {
  const userId = req.userId;
  try {
    await Notifications.updateMany({ userId }, { $set: { read: true } });
    res.status(200).json({ message: "All notifications marked as read." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
