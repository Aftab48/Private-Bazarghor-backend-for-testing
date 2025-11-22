const { catchAsync } = require("../helpers/utils/catchAsync");
const roleSeeder = require("../services/role.service");
const { adminSeeder } = require("../services/staff.service");

const runSeeders = catchAsync(async () => {
  logger.info("🚀 Running all seeders...");
  await roleSeeder(); // roleSeeder now also seeds default permissions.
  await adminSeeder();
  logger.info("🎉 All seeders executed successfully!");
});

module.exports = runSeeders;
