import Collaborator from "../models/collaborator.model.js";
import User from "../models/user.model.js";
import { helper } from "../utils/helper.js";

/**
 * Sets auth context when a valid Bearer token is present (learner user or collaborator).
 * If missing or invalid, continues as guest — no 401.
 */
const optionalAuth = async (req, res, next) => {
  req.userId = null;
  req.userRole = null;
  req.authKind = null;
  req.collaboratorId = null;
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return next();
    const token = authHeader.split(" ")[1];
    if (!token) return next();
    const decoded = await helper.verifyToken(token);

    if (decoded.authKind === "collaborator") {
      const collaborator = await Collaborator.findById(decoded._id).select("jti").lean();
      if (!collaborator || collaborator.jti !== decoded.jti) return next();
      req.authKind = "collaborator";
      req.collaboratorId = decoded._id;
      return next();
    }

    const user = await User.findById(decoded._id).select("role jti").lean();
    if (!user || user.jti !== decoded.jti) return next();
    req.authKind = "user";
    req.userId = user._id;
    req.userRole = user.role;
  } catch {
    // Invalid/expired token — treat as guest
  }
  next();
};

export default optionalAuth;
