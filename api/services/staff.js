const bcrypt = require("bcrypt");
const User = require("../models/user");
const { Role } = require("../models/role");
const adminData = require("../seeders/admin.json").sales_account_creds;
const { catchAsync } = require("../helpers/utils/catchAsync");

const adminSeeder = catchAsync(async () => {
  console.log("⏳ Checking default admin...");
  const existingAdmin = await User.findOne({ email: adminData.email });
  if (existingAdmin) {
    return null; // don't run if admin exists
  }

  const adminRole = await Role.findOne({ code: "ADMIN" });
  if (!adminRole) {
    throw new Error("❌ ADMIN role not found. Run roleSeeder first!");
  }

  const hashedPassword = await bcrypt.hash(adminData.password, 10);
  const newAdmin = await User.create({
    firstName: adminData.firstName,
    lastName: adminData.lastName,
    email: adminData.email,
    passwords: [
      {
        pass: hashedPassword,
        salt: hashedPassword.slice(7, 29),
        isActive: true,
        createdAt: new Date(),
      },
    ],
    roles: [{ roleId: adminRole._id }],
    isPrimaryAdmin: true,
    isActive: true,
  });

  return { email: newAdmin.email };
});

module.exports = adminSeeder;
