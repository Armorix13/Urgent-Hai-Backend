import User from "../models/user.model.js";
import { helper } from "../utils/helper.js";

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "Authorization header is missing" });
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Token is missing" });
    }
    const decoded = await helper.verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ message: "Invalid token" });
    }
    const user = await User.findById(decoded._id);
    if (!user || user.jti !== decoded.jti) {
      return res.status(401).json({ message: "Invalid token, please authenticate" });
    }
    req.userId = decoded._id;
    next();
  } catch (error) {
    return res.status(500).json({ message: `Error: ${error.message}` });
  }
};

export default authenticate;
