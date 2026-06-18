import mongoose from "mongoose";
import users from "../models/auth.js";
import Questions from "../models/Questions.js";
import Answers from "../models/Answers.js";
import jwt from "jsonwebtoken";

export const getAllUsers = async (req, res) => {
  try {
    const allUsers = await users.find(
      {},
      { password: 0, resetPasswordToken: 0, resetPasswordExpires: 0 }
    );
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
    let currentUserId = null;
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (token) {
        let decodeData = jwt.verify(token, process.env.JWT_SECRET);
        currentUserId = decodeData?.id;
      }
    } catch (err) {
      // Ignore token decoding errors, treat as guest
    }

    const isSelf = String(currentUserId) === String(id);
    let user;
    if (isSelf) {
      user = await users.findById(id).populate("savedQuestions");
    } else {
      user = await users.findById(id);
    }

    if (!user) {
      return res.status(404).send("User not found...");
    }

    const questionsAsked = await Questions.countDocuments({ userId: id });
    const answersGiven = await Answers.countDocuments({ userId: id });

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: isSelf ? user.email : undefined,
      about: user.about,
      tags: user.tags,
      reputation: user.reputation,
      badges: user.badges,
      location: user.location,
      website: user.website,
      avatar: user.avatar,
      savedQuestions: isSelf ? user.savedQuestions : [],
      collectives: user.collectives,
      joinedOn: user.joinedOn,
      questionsAsked,
      answersGiven,
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

  if (String(req.userId) !== String(_id)) {
    return res.status(403).json({ message: "Action forbidden: Unauthorized to update this profile." });
  }

  if (website && website.trim() !== "") {
    const isValidUrl = /^https?:\/\/.+/.test(website.trim());
    if (!isValidUrl) {
      return res.status(400).json({ message: "Website must start with http:// or https://" });
    }
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
