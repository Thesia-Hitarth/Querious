import mongoose from "mongoose";

const ViewTrackerSchema = mongoose.Schema({
  trackerKey: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now, expires: 86400 } // Document auto-deletes after 24 hours
});

export default mongoose.model("ViewTracker", ViewTrackerSchema);
