const User = require("../models/user");
const { Role } = require("../models/role");
const adminData = require("../seeders/admin.json").sales_account_creds;
const { catchAsync } = require("../helpers/utils/catchAsync");
const { ROLE } = require("../../config/constants/authConstant");
const { sendEmail, renderTemplate } = require("./send.email");
const { setNewPassword } = require("../services/auth");
const FileService = require("../services/file.service");
const crypto = require("crypto");
const templates = require("../templates/emailTemplates.mjml");

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

const createAdminService = async (body, files, creatorUser) => {
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

    const creator = await User.findById(creatorUser).lean();
    if (!creator) return { success: false, error: "Creator user not found" };

    const creatorRoles = creator?.roles?.map((r) => r.code) || [];

    if (creatorRoles.includes(ROLE.ADMIN)) {
      if (roleType !== ROLE.SUB_ADMIN) {
        return {
          success: false,
          error: "Admins can only create Sub Admin accounts",
        };
      }
    } else if (creatorRoles.includes(ROLE.SUPER_ADMIN)) {
      if (![ROLE.ADMIN, ROLE.SUB_ADMIN].includes(roleType)) {
        return {
          success: false,
          error: "Super Admin can only create Admin or Sub Admin accounts",
        };
      }
    } else {
      return {
        success: false,
        error: "You are not authorized to create admin accounts",
      };
    }

    const generatedPassword = crypto
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
      if (email) {
        const html = renderTemplate(templates.adminCreates, {
          firstName,
          email,
          mobNo,
          generatedPassword,
        });

        await sendEmail(email, "Your Vendor Account Details", html);
      }
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

const deleteAdminService = async (adminId, currentUser) => {
  try {
    const adminToDelete = await User.findById(adminId).lean();
    if (!adminToDelete)
      return { success: false, notFound: true, error: "Admin not found" };

    const user = await User.findById(currentUser).lean();
    if (!user) return { success: false, error: "Unauthorized: User not found" };

    const userRoles = user.roles.map((r) => r.code);
    const targetRoles = adminToDelete.roles.map((r) => r.code);

    if (userRoles.includes(ROLE.SUPER_ADMIN)) {
      if (targetRoles.includes(ROLE.SUPER_ADMIN)) {
        return {
          success: false,
          error: "Super Admin cannot delete another Super Admin",
        };
      }
    } else if (userRoles.includes(ROLE.ADMIN)) {
      if (!targetRoles.includes(ROLE.SUB_ADMIN)) {
        return {
          success: false,
          error: "Admin can only delete Sub Admins",
        };
      }
    } else {
      return {
        success: false,
        error: "You are not authorized to delete any account",
      };
    }

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

const getAdminsService = async (currentUser) => {
  try {
    const user = await User.findById(currentUser).lean();
    if (!user) return { success: false, error: "Unauthorized: User not found" };

    const userRoles = user.roles.map((r) => r.code);

    let filter = {};

    if (userRoles.includes(ROLE.SUPER_ADMIN)) {
      filter = { "roles.code": { $in: [ROLE.ADMIN, ROLE.SUB_ADMIN] } };
    } else if (userRoles.includes(ROLE.ADMIN)) {
      filter = { "roles.code": ROLE.SUB_ADMIN };
    } else if (userRoles.includes(ROLE.SUB_ADMIN)) {
      filter = { _id: user._id };
    } else {
      return { success: false, error: "Unauthorized access" };
    }

    const admins = await User.find(filter)
      .select("firstName lastName email mobNo roles isActive createdAt")
      .lean();

    return { success: true, data: admins };
  } catch (error) {
    logger.error("Get Admins Error:", error);
    return { success: false, error: error.message };
  }
};

const getAdminByIdService = async (adminId, currentUser) => {
  try {
    const targetAdmin = await User.findById(adminId).lean();
    if (!targetAdmin)
      return { success: false, notFound: true, error: "Admin not found" };

    const user = await User.findById(currentUser).lean();
    if (!user) return { success: false, error: "Unauthorized: User not found" };

    const userRoles = user.roles.map((r) => r.code);
    const targetRoles = targetAdmin.roles.map((r) => r.code);

    if (userRoles.includes(ROLE.SUPER_ADMIN)) {
      if (
        targetRoles.includes(ROLE.SUPER_ADMIN) &&
        user._id.toString() !== adminId
      ) {
        return {
          success: false,
          error: "Super Admin cannot access another Super Admin’s data",
        };
      }
    } else if (userRoles.includes(ROLE.ADMIN)) {
      if (!targetRoles.includes(ROLE.SUB_ADMIN)) {
        return {
          success: false,
          error: "Admin can only access Sub Admin details",
        };
      }
    } else if (userRoles.includes(ROLE.SUB_ADMIN)) {
      if (user._id.toString() !== adminId) {
        return {
          success: false,
          error: "Sub Admin can only access their own details",
        };
      }
    } else {
      return { success: false, error: "Unauthorized access" };
    }

    const admin = await User.findById(adminId)
      .select(
        "-passwords -tokens -offNotification -canChangePass -__v -tempRegistration -updatedBy -consentAgree -createdAt -updatedAt -vehicleDetails -storeDetails -shopaddress -shopname -tempRegister -mobVerify -resetPassword -customFields -gender -cityNm -vehicleNo -customerAddress"
      )
      .lean();

    return { success: true, data: admin };
  } catch (error) {
    logger.error("Get Admin By ID Error:", error);
    return { success: false, error: error.message };
  }
};

const updateSelfAdminService = async (currentUser, body, files) => {
  try {
    const userId = currentUser;
    if (!userId)
      return { success: false, notFound: true, error: "User ID missing" };

    const user = await User.findById(userId).lean();
    if (!user)
      return { success: false, notFound: true, error: "User not found" };

    const allowedFields = ["firstName", "lastName", "email", "mobNo"];
    const update = {};
    for (const key of allowedFields) {
      const value = body?.[key];
      if (value !== undefined && value !== null && value !== "") {
        update[key] = value;
      }
    }

    if (files?.profilePicture?.[0]) {
      update.profilePicture = FileService.generateFileObject(
        files.profilePicture[0]
      );
    }

    if (Object.keys(update).length === 0) {
      return {
        success: false,
        validation: true,
        error: "No fields provided to update",
      };
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: update },
      { new: true }
    )
      .select("_id firstName lastName email mobNo profilePicture roles")
      .lean();

    if (!updatedUser)
      return { success: false, error: "Failed to update profile" };

    const resp = { _id: updatedUser._id };
    for (const key of Object.keys(update)) {
      resp[key] = updatedUser[key];
    }

    return { success: true, data: resp };
  } catch (err) {
    logger.error("Self admin update error:", err);
    FileService.deleteUploadedFiles(files);
    return { success: false, error: err.message };
  }
};

module.exports = {
  createAdminService,
  deleteAdminService,
  getAdminsService,
  getAdminByIdService,
  adminSeeder,
  updateSelfAdminService,
};
