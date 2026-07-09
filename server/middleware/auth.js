import jwt from "jsonwebtoken";
import User from "../models/auth.js";

const auth = async (req, res, next) => {
  try {
    const cookies = req.headers.cookie
      ? Object.fromEntries(
          req.headers.cookie.split("; ").map((c) => {
            const eqIndex = c.indexOf("=");
            return eqIndex === -1 ? [c, ""] : [c.substring(0, eqIndex), c.substring(eqIndex + 1)];
          })
        )
      : {};

    const token = req.headers.authorization?.split(" ")[1] || cookies.token;
    if (!token) {
      return res.status(401).json({ message: "Authentication token missing" });
    }

    let decodeData = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decodeData?.id;

    if (req.userId) {
      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(401).json({ message: "User no longer exists" });
      }
      if (user.passwordChangedAt && decodeData.iat) {
        const changedTimestamp = parseInt(user.passwordChangedAt.getTime() / 1000, 10);
        if (changedTimestamp > decodeData.iat) {
          return res.status(401).json({ message: "Token is no longer valid due to password change." });
        }
      }
    }

    next();
  } catch (error) {
    console.warn("Authentication failed:", error.message);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

export default auth;
