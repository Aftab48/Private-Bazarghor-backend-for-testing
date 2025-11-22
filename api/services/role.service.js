const { Role } = require("../models/role");
const rolesData = require("../seeders/roles.json");
const { catchAsync } = require("../helpers/utils/catchAsync");
const logger = require("../helpers/utils/logger");
const {
  PERMISSIONS,
  ROLE_DEFAULT_PERMISSIONS,
} = require("../../config/constants/permissionConstant");
const { ROLE } = require("../../config/constants/authConstant");

const roleSeeder = catchAsync(async () => {
  logger.info("⏳ Checking roles in database...");
  for (const role of rolesData) {
    const existingRole = await Role.findOne({ code: role.code });
    if (!existingRole) {
      await Role.create(role);
      logger.info(`✅ Added role: ${role.name}`);
    } else {
      logger.warn(`Role already exists: ${role.name} (skipped)`);
    }
  }

  // Assign default permissions & backfill new ones
  const allRoles = await Role.find().lean();
  for (const r of allRoles) {
    const defaults = ROLE_DEFAULT_PERMISSIONS[r.code] || [];
    const requiredPerms =
      r.code === ROLE.SUPER_ADMIN ? Object.values(PERMISSIONS) : defaults;

    if (!requiredPerms.length) continue;

    if (!r.permissions || r.permissions.length === 0) {
      await Role.updateOne({ _id: r._id }, { $set: { permissions: requiredPerms } });
      logger.info(`🔐 Permissions set for role: ${r.code}`);
      continue;
    }

    const current = new Set(r.permissions);
    const missing = requiredPerms.filter((perm) => !current.has(perm));

    if (missing.length) {
      await Role.updateOne(
        { _id: r._id },
        { $addToSet: { permissions: { $each: missing } } }
      );
      logger.info(
        `🧩 Added ${missing.length} baseline permissions to role: ${r.code}`
      );
    }
  }

  logger.info("🎯 Role seeding completed successfully!");
});

const getRolesWithPermissions = async () => {
  return Role.find().select("name code permissions weight").lean();
};

module.exports = roleSeeder;
module.exports.getRolesWithPermissions = getRolesWithPermissions;
