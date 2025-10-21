const { Role } = require("../models/role");
const rolesData = require("../seeders/roles.json");
const { catchAsync } = require("../helpers/utils/catchAsync");

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

  console.log("🎯 Role seeding completed successfully!");
});

module.exports = roleSeeder;
