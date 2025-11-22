const {
  listRoles,
  updateRolePermissions,
  bulkUpdateRolePermissions,
} = require("../../services/rolePermission.service");
const { catchAsync } = require("../../helpers/utils/catchAsync");
const messages = require("../../helpers/utils/messages");

// Utility to normalize incoming permissions payload
const normalizePermissions = (raw) => {
  if (Array.isArray(raw))
    return raw.filter(Boolean).map((p) => String(p).trim());
  if (typeof raw === "string") {
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
};

const getRolesController = catchAsync(async (req, res) => {
  const resp = await listRoles();
  if (resp.success) {
    return messages.successResponse(
      resp.data,
      res,
      "Roles fetched successfully"
    );
  }
  return messages.failureResponse(resp.error || "Failed to fetch roles", res);
});

const updateRolePermissionsController = catchAsync(async (req, res) => {
  const { code } = req.params;
  const list = normalizePermissions(req.body.permissions);
  const resp = await updateRolePermissions(req.user, code, list);

  if (resp.success) {
    return messages.rolePermissionsUpdatedResponse(
      resp.data,
      res,
      "Role permissions updated successfully"
    );
  }

  if (resp.forbidden) {
    return messages.forbidden(resp.error || "Forbidden", res);
  }
  if (resp.notFound) {
    return messages.recordNotFound(res, resp.error || "Role not found");
  }
  if (resp.missingBaseline) {
    return messages.badRequest(
      { missingBaseline: resp.missingBaseline },
      res,
      resp.error || "Baseline permissions cannot be removed"
    );
  }

  return messages.failureResponse(
    resp.error || "Failed to update role permissions",
    res
  );
});

const bulkUpdateRolePermissionsController = catchAsync(async (req, res) => {
  const assignments = req.body.assignments;
  const resp = await bulkUpdateRolePermissions(req.user, assignments);
  if (resp.success) {
    return messages.rolePermissionsUpdatedResponse(
      resp.data,
      res,
      "Bulk role permissions processed"
    );
  }
  if (resp.forbidden) return messages.forbidden(resp.error || "Forbidden", res);
  return messages.failureResponse(resp.error || "Bulk update failed", res);
});

module.exports = {
  getRolesController,
  updateRolePermissionsController,
  bulkUpdateRolePermissionsController,
};
