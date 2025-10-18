const { Role } = require("../models/role");
const rolesData = require("../seeders/roles.json");
const { catchAsync } = require("../helpers/utils/catchAsync");

const roleSeeder = catchAsync(async () => {
  console.log("⏳ Starting role seeding...");
  const codes = rolesData.map((r) => r.code);
  const existingCount = await Role.countDocuments({ code: { $in: codes } });

  if (existingCount === rolesData.length) {
    console.log("✅ All roles already seeded — skipping seeder.");
    return;
  }

  for (const role of rolesData) {
    const exists = await Role.findOne({ code: role.code });
    if (!exists) {
      await Role.create(role);
      console.log(`✅ Role created: ${role.code}`);
    } else {
      console.log(`➡️ Role already exists: ${role.code}`);
    }
  }

  console.log("🎉 Role seeding completed!");
});

module.exports = roleSeeder;
