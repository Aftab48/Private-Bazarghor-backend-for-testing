const User = require("../models/user");
const { Role } = require("../models/role");
const adminData = require("../seeders/admin.json").sales_account_creds;
const { catchAsync } = require("../helpers/utils/catchAsync");
const { ROLE } = require("../../config/constants/authConstant");
const { sendEmail } = require("./send.email");
const { setNewPassword } = require("../services/auth");
const FileService = require("../services/file.service");
const crypto = require("crypto");

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
    passwords: [{ pass: adminData.password }],
    roles: [{ roleId: adminRole._id, code: adminRole.code }],
    isPrimaryAdmin: true,
    isActive: true,
  });
  logger.error(`✅ Default admin created: ${newAdmin.email}`);
  return newAdmin;
});

const createAdminService = async (body, files) => {
  try {
    const { email, firstName, lastName, mobNo, roleType } = body;

    if (!email || !roleType)
      return {
        success: false,
        validation: true,
        error: "Email & Role are required",
      };

    const existing = await User.findOne({ email }).lean();
    if (existing) return { success: false, error: "Email already registered" };

    const role = await Role.findOne({ code: roleType }).lean();
    if (!role?._id)
      return {
        success: false,
        notFound: true,
        error: "Role not found in system",
      };

    let generatedPassword = crypto
      .randomBytes(9)
      .toString("base64")
      .replace(/\+/g, "A")
      .replace(/\//g, "B")
      .slice(0, 10);

    const newAdminData = {
      email,
      firstName,
      lastName,
      mobNo,
      roles: [{ roleId: role._id, code: role.code }],
      isActive: true,
      profileCompleted: 1,
    };

    if (files?.profilePicture?.[0]) {
      newAdminData.profilePicture = FileService.generateFileObject(
        files.profilePicture[0]
      );
    }

    const admin = await User.create(newAdminData);
    const setPassResult = await setNewPassword(
      admin._id,
      generatedPassword,
      User
    );
    if (!setPassResult) {
      logger.error("Failed to set password for new admin:", admin._id);
      await User.findByIdAndDelete(admin._id).catch(() => {});
      return { success: false, error: "Failed to set password for new admin" };
    }

    try {
      const html = `
        <div style="font-family: sans-serif; line-height: 1.6;">
          <h3>Hello ${firstName || "Admin"},</h3>
          <p>Your admin account has been created. Use the credentials below to log in:</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Password:</strong> ${generatedPassword}</p>
          <p>Please change your password after first login.</p>
        </div>
      `;
      await sendEmail(email, "Your Admin Account Credentials", html);
    } catch (emailErr) {
      logger.error("Failed to send admin credentials email:", emailErr);
      return {
        success: true,
        data: admin,
        warning: "Account created but failed to send email with credentials",
      };
    }

    return { success: true, data: admin };
  } catch (error) {
    logger.error("Create Admin Error:", error);
    FileService.deleteUploadedFiles(files);
    return { success: false, error: error.message };
  }
};

const deleteAdminService = async (adminId) => {
  try {
    const admin = await User.findById(adminId).lean();
    if (!admin)
      return { success: false, notFound: true, error: "Admin not found" };

    await User.findByIdAndUpdate(adminId, { isActive: false });
    return {
      success: true,
      data: { message: "Admin deactivated successfully" },
    };
  } catch (error) {
    logger.error("Delete Admin Error:", error);
    return { success: false, error: error.message };
  }
};

const getAdminsService = async () => {
  try {
    const admins = await User.find({
      "roles.code": { $in: [ROLE.ADMIN, ROLE.SUB_ADMIN] },
    })
      .select("firstName lastName email mobNo roles isActive createdAt")
      .lean();

    return { success: true, data: admins };
  } catch (error) {
    logger.error("Get Admins Error:", error);
    return { success: false, error: error.message };
  }
};

const getAdminByIdService = async (adminId) => {
  try {
    const admin = await User.findById(adminId)
      .select(
        "-passwords -tokens -offNotification -canChangePass -__v -tempRegistration -updatedBy -consentAgree  -createdAt -updatedAt -vehicleDetails  -storeDetails -shopaddress -shopname -tempRegister -mobVerify -resetPassword -customFields -gender -cityNm -vehicleNo -customerAddress"
      )
      .lean();
    if (!admin)
      return { success: false, notFound: true, error: "Admin not found" };
    return { success: true, data: admin };
  } catch (error) {
    logger.error("Get Admin By ID Error:", error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  createAdminService,
  deleteAdminService,
  getAdminsService,
  getAdminByIdService,
  adminSeeder,
};
