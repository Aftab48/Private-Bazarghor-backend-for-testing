const { verifyToken } = require("../helpers/utils/jwt");
const messages = require("../helpers/utils/messages");

exports.authMiddleware = (allowedRoles = []) => {
  return async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // messages.unAuthorizedRequest expects (message, res)
      return messages.unAuthorizedRequest("Authorization token missing", res);
    }

    const token = authHeader.split(" ")[1];
    const decoded = await verifyToken(token);

    if (!decoded) {
      return messages.unAuthorizedRequest("Invalid or expired token", res);
    }

    // store only the user id for downstream handlers that expect an id
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
