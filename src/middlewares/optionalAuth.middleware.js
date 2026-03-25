import User from "../models/user.model.js";
import { helper } from "../utils/helper.js";

/**
 * Sets req.userId and req.userRole when a valid Bearer token is present.
 * If missing or invalid, continues without auth (guest) — no 401.
 */
const optionalAuth = async (req, res, next) => {
  req.userId = null;
  req.userRole = null;
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return next();
    const token = authHeader.split(" ")[1];
    if (!token) return next();
    const decoded = await helper.verifyToken(token);
    const user = await User.findById(decoded._id).select("role jti").lean();
    if (!user || user.jti !== decoded.jti) return next();
    req.userId = user._id;
    req.userRole = user.role;
  } catch {
    // Invalid/expired token — treat as guest
  }
  next();
};

export default optionalAuth;
