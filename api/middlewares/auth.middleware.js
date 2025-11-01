const { verifyToken } = require("../helpers/utils/jwt");
const messages = require("../helpers/utils/messages");
const { ROLE } = require("../../config/constants/authConstant");
const User = require("../models/user");

exports.authMiddleware = (allowedRoles = []) => {
  return async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return messages.unAuthorizedRequest("Authorization token missing", res);
    }

    const token = authHeader.split(" ")[1];
    const decoded = await verifyToken(token);

    if (!decoded) {
      return messages.unAuthorizedRequest("Invalid or expired token", res);
    }

    req.user = decoded.id || decoded._id || decoded;

    if (allowedRoles.length > 0) {
      const hasRole = decoded.roles?.some((r) => allowedRoles.includes(r.code));
      if (!hasRole) {
        return messages.unAuthorizedRequest("Access denied", res);
      }
    }
    next();
  };
};

exports.checkSuperAdmin = async (req, res, next) => {
  try {
    const userId = req.user;

    const user = await User.findById(userId).lean();
    if (!user) return messages.recordNotFound(res, "User not found");

    const allowedAdminRoles = [ROLE.SUPER_ADMIN, ROLE.ADMIN];
    const isAdmin = user?.roles?.some((r) =>
      allowedAdminRoles.includes(r.code)
    );
    if (!isAdmin) {
      return { success: false, error: "Unauthorized access by admin" };
    }
    next();
  } catch (err) {
    console.error("checkSuperAdmin error:", err);
    return messages.internalServerError(res, {
      message: "Authorization failed",
    });
  }
};
