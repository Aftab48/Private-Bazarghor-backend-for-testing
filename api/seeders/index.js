const roleSeeder = require("../services/role");
const adminSeeder = require("../services/staff");

const runSeeders = async () => {
  console.log("🚀 Running all seeders...");
  await roleSeeder(); // first roles
  await adminSeeder(); // then admin
  console.log("✅ All seeders executed successfully!");
};

module.exports = {
  roleSeeder,
  adminSeeder,
  runSeeders,
};
