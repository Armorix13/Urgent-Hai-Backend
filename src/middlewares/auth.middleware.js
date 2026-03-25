import User from "../models/user.model.js";
import { helper } from "../utils/helper.js";

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        status: 401,
        message: "Authorization header is missing",
        data: null,
      });
    }
    const token = authHeader.split(" ")[1];
    if (
      !token ||
      token === "null" ||
      token === "undefined" ||
      token.trim() === ""
    ) {
      return res.status(401).json({
        status: 401,
        message: "Token is missing or invalid",
        data: null,
      });
    }
    const decoded = await helper.verifyToken(token);
    if (!decoded) {
      return res.status(401).json({
        status: 401,
        message: "Invalid token",
        data: null,
      });
    }
    const user = await User.findById(decoded._id);
    if (!user || user.jti !== decoded.jti) {
      return res.status(401).json({
        status: 401,
        message: "Invalid token, please authenticate",
        data: null,
      });
    }
    req.userId = decoded._id;
    next();
  } catch (error) {
    next(error);
  }
};

export default authenticate;
