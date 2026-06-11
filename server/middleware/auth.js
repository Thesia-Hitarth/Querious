import jwt from "jsonwebtoken";

const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Authentication token missing" });
    }

    let decodeData = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decodeData?.id;

    next();
  } catch (error) {
    console.warn("Authentication failed:", error.message);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

export default auth;
