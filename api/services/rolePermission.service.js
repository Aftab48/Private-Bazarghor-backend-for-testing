// Curl Examples:
//
// 1) Update single role (ADMIN)
// curl -X PUT "$BASE_URL/admin/roles/ADMIN/permissions" \
//  -H "Authorization: Bearer SUPER_ADMIN_TOKEN" \
//  -H "Content-Type: application/json" \
//  -d '{"permissions":["view_admins","create_sub_admin","update_sub_admin","delete_sub_admin","view_vendors","update_vendor","view_delivery_partners","update_delivery_partner","view_customers","update_customer","verify_user_status","view_products","create_product","update_product","delete_product","view_orders","manage_orders","view_stores","manage_role_permissions"]}'
//
// 2) Update single role (SUB_ADMIN)
// curl -X PUT "$BASE_URL/admin/roles/SUB_ADMIN/permissions" \
//  -H "Authorization: Bearer SUPER_ADMIN_TOKEN" \
//  -H "Content-Type: application/json" \
//  -d '{"permissions":["view_vendors","view_products","view_orders","update_product"]}'
//
// 3) Bulk update ADMIN + SUB_ADMIN
// curl -X PUT "$BASE_URL/admin/roles/bulk/permissions" \
//  -H "Authorization: Bearer SUPER_ADMIN_TOKEN" \
//  -H "Content-Type: application/json" \
//  -d '{
//       "assignments": {
//         "ADMIN": ["view_admins","create_sub_admin","update_sub_admin","delete_sub_admin","view_vendors","update_vendor","view_delivery_partners","update_delivery_partner","view_customers","update_customer","verify_user_status","view_products","create_product","update_product","delete_product","view_orders","manage_orders","view_stores","manage_role_permissions"],
//         "SUB_ADMIN": ["view_vendors","view_products","view_orders","update_product"]
//       }
//     }'
//
// 4) Super Admin full set (must include all permissions)
// curl -X PUT "$BASE_URL/admin/roles/SUPER_ADMIN/permissions" \
//  -H "Authorization: Bearer SUPER_ADMIN_TOKEN" \
//  -H "Content-Type: application/json" \
//  -d '{"permissions":["view_admins","create_admin","update_admin","delete_admin","manage_role_permissions","create_sub_admin","update_sub_admin","delete_sub_admin","view_vendors","create_vendor","update_vendor","delete_vendor","view_delivery_partners","create_delivery_partner","update_delivery_partner","delete_delivery_partner","view_customers","create_customer","update_customer","delete_customer","verify_user_status","view_products","create_product","update_product","delete_product","view_orders","manage_orders","view_stores","manage_subscriptions"]}'
//
// 5) Attempt removing baseline (will fail)
// curl -X PUT "$BASE_URL/admin/roles/ADMIN/permissions" \
//  -H "Authorization: Bearer SUPER_ADMIN_TOKEN" \
//  -H "Content-Type: application/json" \
//  -d '{"permissions":["view_admins"]}'
//
// 6) Admin bulk (needs manage_role_permissions granted first)
// curl -X PUT "$BASE_URL/admin/roles/bulk/permissions" \
//  -H "Authorization: Bearer ADMIN_TOKEN" \
//  -H "Content-Type: application/json" \
//  -d '{"assignments":{"SUB_ADMIN":["view_vendors","view_products","view_orders"]}}'
//
const { Role } = require("../models/role");
const User = require("../models/user");
const { ROLE } = require("../../config/constants/authConstant");
const {
  PERMISSIONS,
  ROLE_DEFAULT_PERMISSIONS,
} = require("../../config/constants/permissionConstant");

const listRoles = async () => {
  const roles = await Role.find().select("name code permissions weight").lean();
  return { success: true, data: roles };
};

const updateRolePermissions = async (actorUserId, roleCode, permissions) => {
  if (!actorUserId || !roleCode)
    return { success: false, error: "actorUserId & roleCode required" };

  const actor = await User.findById(actorUserId).lean();
  if (!actor) return { success: false, error: "Actor not found" };

  const actorCodes = (actor.roles || []).map((r) => r.code);
  const isSuper = actorCodes.includes(ROLE.SUPER_ADMIN);

  if (!isSuper) {
    const adminRoles = await Role.find({ code: { $in: actorCodes } })
      .select("permissions code")
      .lean();
    const aggregated = new Set(adminRoles.flatMap((r) => r.permissions || []));
    if (!aggregated.has(PERMISSIONS.MANAGE_ROLE_PERMISSIONS)) {
      return {
        success: false,
        forbidden: true,
        error: "No permission to modify role permissions",
      };
    }
  }

  const role = await Role.findOne({ code: roleCode }).lean();
  if (!role) return { success: false, error: "Target role not found" };

  // Non-super actors can only modify SUB_ADMIN
  if (!isSuper && role.code !== ROLE.SUB_ADMIN) {
    return {
      success: false,
      forbidden: true,
      error: "Only SUPER_ADMIN can modify this role",
    };
  }

  // Prevent stripping critical capabilities from SUPER_ADMIN
  if (role.code === ROLE.SUPER_ADMIN) {
    const allPerms = Object.values(PERMISSIONS);
    const missing = allPerms.filter((p) => !permissions.includes(p));
    if (missing.length) {
      return {
        success: false,
        error: "SUPER_ADMIN must retain all permissions",
      };
    }
  }

  // Baseline handling:
  // - SUPER_ADMIN can remove baseline from ADMIN/SUB_ADMIN.
  // - ADMIN can remove baseline only for SUB_ADMIN.
  const baseline = ROLE_DEFAULT_PERMISSIONS[role.code] || [];
  const missingBaseline = baseline.filter((b) => !permissions.includes(b));
  let baselineRemoved = [];
  if (missingBaseline.length) {
    const canRemoveBaseline = isSuper || role.code === ROLE.SUB_ADMIN; // admin allowed only for sub-admin
    if (!canRemoveBaseline || role.code === ROLE.SUPER_ADMIN) {
      return {
        success: false,
        error: "Cannot remove baseline permissions",
        missingBaseline,
      };
    }
    baselineRemoved = missingBaseline;
  }

  await Role.updateOne({ _id: role._id }, { $set: { permissions } });
  return {
    success: true,
    data: { roleCode, permissions, baselineRemoved },
  };
};

const bulkUpdateRolePermissions = async (
  actorUserId,
  rolesPermissionsMap = {}
) => {
  if (
    !actorUserId ||
    !rolesPermissionsMap ||
    typeof rolesPermissionsMap !== "object"
  ) {
    return {
      success: false,
      error: "actorUserId & rolesPermissionsMap required",
    };
  }

  const actor = await User.findById(actorUserId).lean();
  if (!actor) return { success: false, error: "Actor not found" };

  const actorCodes = (actor.roles || []).map((r) => r.code);
  const isSuper = actorCodes.includes(ROLE.SUPER_ADMIN);
  if (!isSuper) {
    const actorRoles = await Role.find({ code: { $in: actorCodes } })
      .select("permissions code")
      .lean();
    const aggregated = new Set(actorRoles.flatMap((r) => r.permissions || []));
    if (!aggregated.has(PERMISSIONS.MANAGE_ROLE_PERMISSIONS)) {
      return {
        success: false,
        forbidden: true,
        error: "No permission to modify role permissions",
      };
    }
  }

  const allPerms = Object.values(PERMISSIONS);
  const summary = { updated: [], failed: [] };

  for (const [roleCode, perms] of Object.entries(rolesPermissionsMap)) {
    try {
      const role = await Role.findOne({ code: roleCode }).lean();
      if (!role) {
        summary.failed.push({ roleCode, error: "Role not found" });
        continue;
      }

      // Non-super actors can only modify SUB_ADMIN
      if (!isSuper && role.code !== ROLE.SUB_ADMIN) {
        summary.failed.push({
          roleCode,
          error: "Only SUPER_ADMIN can modify this role",
        });
        continue;
      }

      const permissions = Array.isArray(perms) ? perms.filter(Boolean) : [];

      // SUPER_ADMIN role must keep all permissions
      if (role.code === ROLE.SUPER_ADMIN) {
        const missing = allPerms.filter((p) => !permissions.includes(p));
        if (missing.length) {
          summary.failed.push({
            roleCode,
            error: "SUPER_ADMIN must retain all permissions",
          });
          continue;
        }
      }

      // Baseline handling (same rule as single update)
      const baseline = ROLE_DEFAULT_PERMISSIONS[role.code] || [];
      const missingBaseline = baseline.filter((b) => !permissions.includes(b));
      const canRemoveBaseline = isSuper || role.code === ROLE.SUB_ADMIN; // admin allowed only for sub-admin

      if (
        missingBaseline.length &&
        (!canRemoveBaseline || role.code === ROLE.SUPER_ADMIN)
      ) {
        summary.failed.push({
          roleCode,
          error: "Cannot remove baseline permissions",
          missingBaseline,
        });
        continue;
      }

      await Role.updateOne({ _id: role._id }, { $set: { permissions } });
      summary.updated.push({
        roleCode,
        permissions,
        baselineRemoved:
          missingBaseline.length &&
          canRemoveBaseline &&
          role.code !== ROLE.SUPER_ADMIN
            ? missingBaseline
            : [],
      });
    } catch (err) {
      summary.failed.push({ roleCode, error: err.message });
    }
  }

  return { success: true, data: summary };
};

module.exports = {
  listRoles,
  updateRolePermissions,
  bulkUpdateRolePermissions,
};
