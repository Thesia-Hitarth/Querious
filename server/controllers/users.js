import mongoose from "mongoose";
import users from "../models/auth.js";

export const getAllUsers = async (req, res) => {
  try {
    const allUsers = await users.find();
    const allUserDetails = [];
    allUsers.forEach((user) => {
      allUserDetails.push({
        _id: user._id,
        name: user.name,
        about: user.about,
        tags: user.tags,
        reputation: user.reputation,
        badges: user.badges,
        location: user.location,
        website: user.website,
        avatar: user.avatar,
        savedQuestions: user.savedQuestions,
        collectives: user.collectives,
        joinedOn: user.joinedOn,
      });
    });
    res.status(200).json(allUserDetails);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const getUserDetails = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).send("User unavailable...");
  }
  try {
    // Populate savedQuestions with Question model details
    const user = await users.findById(id).populate("savedQuestions");
    if (!user) {
      return res.status(404).send("User not found...");
    }
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      about: user.about,
      tags: user.tags,
      reputation: user.reputation,
      badges: user.badges,
      location: user.location,
      website: user.website,
      avatar: user.avatar,
      savedQuestions: user.savedQuestions,
      collectives: user.collectives,
      joinedOn: user.joinedOn,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  const { id: _id } = req.params;
  const { name, about, tags, location, website, avatar, collectives } = req.body;

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).send("User unavailable...");
  }

  try {
    const updatedProfile = await users.findByIdAndUpdate(
      _id,
      { $set: { name, about, tags, location, website, avatar, collectives } },
      { new: true }
    );
    res.status(200).json(updatedProfile);
  } catch (error) {
    res.status(405).json({ message: error.message });
  }
};

export const toggleSaveQuestion = async (req, res) => {
  const { id: userId } = req.params;
  const { questionId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(404).send("User unavailable...");
  }
  if (!mongoose.Types.ObjectId.isValid(questionId)) {
    return res.status(404).send("Question unavailable...");
  }

  try {
    const user = await users.findById(userId);
    if (!user) {
      return res.status(404).send("User not found...");
    }

    const index = user.savedQuestions.indexOf(questionId);
    if (index === -1) {
      user.savedQuestions.push(questionId);
    } else {
      user.savedQuestions.splice(index, 1);
    }

    await user.save();
    res.status(200).json({ savedQuestions: user.savedQuestions });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Failed to toggle bookmark" });
  }
};
