const { verifyToken } = require("../helpers/utils/jwt");
const messages = require("../helpers/utils/messages");
const { ROLE } = require("../../config/constants/authConstant");
const User = require("../models/user");
const { Role } = require("../models/role");
const logger = require("../helpers/utils/logger");

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
    logger.error("checkSuperAdmin error:", err);
    return messages.internalServerError(res, {
      message: "Authorization failed",
    });
  }
};

exports.permissionMiddleware = (required = [], { any = false } = {}) => {
  return async (req, res, next) => {
    if (!required.length) {
      // Attach aggregated permissions even when not enforcing
      try {
        const user = await User.findById(req.user).lean();
        if (user) {
          const roleCodes = (user.roles || []).map((r) => r.code);
          const roleDocs = await Role.find({ code: { $in: roleCodes } })
            .select("permissions code")
            .lean();
          req.userPermissions = Array.from(
            new Set(roleDocs.flatMap((r) => r.permissions || []))
          );
        }
      } catch (_) {}
      return next();
    }
    try {
      const user = await User.findById(req.user).lean();
      if (!user) return messages.unAuthorizedRequest("User not found", res);

      const roleCodes = (user.roles || []).map((r) => r.code);
      const roleDocs = await Role.find({ code: { $in: roleCodes } })
        .select("permissions code")
        .lean();
      const aggregated = new Set(roleDocs.flatMap((r) => r.permissions || []));
      req.userPermissions = Array.from(aggregated); // exposed for controllers

      const hasAll = required.every((p) => aggregated.has(p));
      const hasAny = required.some((p) => aggregated.has(p));

      if ((!any && !hasAll) || (any && !hasAny)) {
        return messages.unAuthorizedRequest("Permission denied", res);
      }
      next();
    } catch (e) {
      return messages.internalServerError(res, {
        message: "Permission check failed",
      });
    }
  };
};

// Lightweight middleware just to attach permissions without enforcing anything
exports.attachPermissions = async (req, res, next) => {
  try {
    const user = await User.findById(req.user).lean();
    if (!user) return messages.unAuthorizedRequest("User not found", res);
    const roleCodes = (user.roles || []).map((r) => r.code);
    const roleDocs = await Role.find({ code: { $in: roleCodes } })
      .select("permissions code")
      .lean();
    req.userPermissions = Array.from(
      new Set(roleDocs.flatMap((r) => r.permissions || []))
    );
    next();
  } catch (err) {
    return messages.internalServerError(res, {
      message: "Failed to attach permissions",
    });
  }
};
