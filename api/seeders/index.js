const { catchAsync } = require("../helpers/utils/catchAsync");
const roleSeeder = require("../services/role");
const adminSeeder = require("../services/staff");

const runSeeders = catchAsync(async () => {
  logger.info("🚀 Running all seeders...");
  await roleSeeder();
  await adminSeeder();
  logger.info("🎉 All seeders executed successfully!");
});

module.exports = runSeeders;
