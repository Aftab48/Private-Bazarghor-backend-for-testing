const User = require("../models/user");
const { Role } = require("../models/role");
const adminData = require("../seeders/admin.json").sales_account_creds;
const { catchAsync } = require("../helpers/utils/catchAsync");
const { ROLE } = require("../../config/constants/authConstant");

const adminSeeder = catchAsync(async () => {
  logger.info("⏳ Checking default admin...");
  const existingAdmin = await User.findOne({ email: adminData.email });
  const adminRole = await Role.findOne({ code: ROLE.SUPER_ADMIN });

  if (!adminRole) {
    logger.error("❌ ADMIN role not found. Run roleSeeder first!");
  }

  if (existingAdmin) {
    logger.error("⚠️ Default admin already exists (skipped).");
    return existingAdmin;
  }


  const newAdmin = await User.create({
    firstName: adminData.firstName,
    lastName: adminData.lastName,
    email: adminData.email,
    mobNo: adminData.mobNo,
    passwords: [  { pass: adminData.password }],
    roles: [{ roleId: adminRole._id , code: adminRole.code }],
    isPrimaryAdmin: true,
    isActive: true,
  });
  logger.error(`✅ Default admin created: ${newAdmin.email}`);
  return newAdmin;
});

module.exports = adminSeeder;
