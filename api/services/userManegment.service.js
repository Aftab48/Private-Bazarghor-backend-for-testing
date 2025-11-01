const User = require("../models/user");
const { Role } = require("../models/role");
const {
  VENDOR_STATUS,
  DELIVERY_PARTNER_STATUS,
  CUSTOMER_STATUS,
  ROLE,
} = require("../../config/constants/authConstant");
const { sendEmail, renderTemplate } = require("../services/send.email");
const FileService = require("../services/file.service");
const templates = require("../templates/emailTemplates.mjml");

const createVendorByAdmin = async (req, createdBy) => {
  try {
    const {
      email,
      firstName,
      lastName,
      mobNo,
      storeName,
      pinCode,
      storeAddress,
      roleType, // e.g. "VENDOR"
    } = req.body;

    if (!mobNo) return { success: false, error: "Mobile number is required" };
    if (!roleType) return { success: false, error: "Role type is required" };

    const existing = await User.findOne({ mobNo });
    if (existing)
      return { success: false, error: "Mobile number already registered" };

    const vendorRole = await Role.findOne({ code: roleType }).lean();
    if (!vendorRole?._id)
      return { success: false, error: `${roleType} role not found` };

    const storePictures = [];
    if (req.files?.storePictures?.length) {
      req.files.storePictures.forEach((f) =>
        storePictures.push(FileService.generateFileObject(f))
      );
    }

    const vendorData = {
      email,
      firstName,
      lastName,
      mobNo,
      pinCode,
      roles: [{ roleId: vendorRole._id, code: vendorRole.code }],
      isActive: true,
      profileCompleted: 0,
      status: VENDOR_STATUS.APPROVED,
      termsAndCondition: false,
      storeDetails: {
        storeName: storeName,
        storeAddress: storeAddress,
        storePictures,
      },
      createdBy, // 🟢 Store the ID of the creator
    };

    if (req.files?.profilePicture?.[0]) {
      vendorData.profilePicture = FileService.generateFileObject(
        req.files.profilePicture[0]
      );
    }

    const vendor = await User.create(vendorData);

    if (email) {
      const html = renderTemplate(templates.vendorCreated, {
        firstName: firstName || "Vendor",
        mobNo,
      });

      await sendEmail(email, "Your Vendor Account Details", html);
    }

    return { success: true, data: vendor };
  } catch (err) {
    logger.error("Admin Vendor creation error:", err);
    return { success: false, error: err.message };
  }
};

const getAllVendors = async (query = {}) => {
  try {
    const vendors = await User.find({ "roles.code": ROLE.VENDOR, ...query })
      .select(
        "firstName lastName email mobNo roles isActive  status storeDetails profilePicture"
      )
      .lean();
    return { success: true, data: vendors };
  } catch (err) {
    logger.error("Get vendors error:", err);
    return { success: false, error: err.message };
  }
};

const getVendorById = async (id) => {
  try {
    const vendor = await User.findOne({
      _id: id,
      "roles.code": ROLE.VENDOR,
    }).select(
      "firstName lastName email mobNo roles isActive  status storeDetails profilePicture"
    );
    if (!vendor) return { success: false, error: "Vendor not found" };
    return { success: true, data: vendor };
  } catch (err) {
    logger.error("Get vendor by ID error:", err);
    return { success: false, error: err.message };
  }
};

const updateVendorByAdmin = async (id, body, files) => {
  try {
    if (!id)
      return { success: false, notFound: true, error: "Vendor ID missing" };

    const vendor = await User.findOne({
      _id: id,
      "roles.code": ROLE.VENDOR,
    }).lean();

    if (!vendor) return { success: false, error: "Vendor not found" };

    const allowedFields = [
      "firstName",
      "lastName",
      "email",
      "mobNo",
      "dob",
      "gender",
      "cityNm",
      "pinCode",
      "isActive",
      "status",
      "storeName",
      "storeAddress",
    ];

    const update = {};

    for (const key of allowedFields) {
      if (
        Object.prototype.hasOwnProperty.call(body, key) &&
        body[key] !== undefined
      ) {
        update[key] = body[key];
      }
    }

    if (files?.profilePicture?.[0]) {
      update.profilePicture = FileService.generateFileObject(
        files.profilePicture[0]
      );
    }

    if (files?.storePictures?.length) {
      const pictures = files.storePictures.map((f) =>
        FileService.generateFileObject(f)
      );
      update.storeDetails = update.storeDetails || {};
      update.storeDetails.storePictures = pictures;
    }

    if (Object.keys(update).length === 0) {
      return { success: false, error: "No valid fields provided for update" };
    }
    const updateQuery = {};
    if (update.storeName) {
      updateQuery["storeDetails.storeName"] = update.storeName;
      delete update.storeName;
    }

    if (update.storeAddress) {
      updateQuery["storeDetails.storeAddress"] = update.storeAddress;
      delete update.storeAddress;
    }
    if (update.storeDetails) {
      for (const [key, value] of Object.entries(update.storeDetails)) {
        updateQuery[`storeDetails.${key}`] = value;
      }
      delete update.storeDetails;
    }

    Object.assign(updateQuery, update);

    const updatedVendor = await User.findByIdAndUpdate(
      id,
      { $set: updateQuery },
      { new: true }
    ).lean();

    if (!updatedVendor) {
      return { success: false, error: "Vendor not found or update failed" };
    }

    const resp = { _id: updatedVendor._id };

    for (const key of Object.keys(updateQuery)) {
      if (key.startsWith("storeDetails.")) {
        const field = key.split(".")[1];
        resp.storeDetails = resp.storeDetails || {};
        resp.storeDetails[field] = updatedVendor.storeDetails?.[field] ?? null;
      } else {
        resp[key] = updatedVendor[key];
      }
    }

    return { success: true, data: resp };
  } catch (err) {
    logger.error("Update vendor by admin error:", err);
    return { success: false, error: err.message };
  }
};

const deleteVendorByAdmin = async (id) => {
  try {
    const vendor = await User.findOne({ _id: id, "roles.code": ROLE.VENDOR });
    if (!vendor) return { success: false, error: "Vendor not found" };

    vendor.isActive = false;
    await vendor.save();

    return {
      success: true,
      data: { message: "Vendor deactivated successfully" },
    };
  } catch (err) {
    logger.error("Delete vendor error:", err);
    return { success: false, error: err.message };
  }
};

//Delivery Partner Services
const createDeliveryPartnerByAdmin = async (req, createdBy) => {
  try {
    const {
      email,
      firstName,
      lastName,
      mobNo,
      dob,
      gender,
      roleType, // e.g. "DELIVERY_PARTNER"
    } = req.body;

    if (!mobNo) return { success: false, error: "Mobile number is required" };
    if (!dob) return { success: false, error: "Date of birth is required" };
    if (!roleType)
      return {
        success: false,
        error: "Role type (DELIVERY_PARTNER) is required",
      };

    const existing = await User.findOne({ mobNo });
    if (existing)
      return { success: false, error: "Mobile number already registered" };

    const deliveryRole = await Role.findOne({ code: roleType }).lean();
    if (!deliveryRole?._id)
      return { success: false, error: `${roleType} role not found` };

    const deliveryData = {
      email,
      firstName,
      lastName,
      mobNo,
      gender,
      dob,
      roles: [{ roleId: deliveryRole._id, code: deliveryRole.code }],
      isActive: true,
      profileCompleted: 0,
      status: DELIVERY_PARTNER_STATUS.APPROVED,
      termsAndCondition: false,
      createdBy, // 🟢 Track who created this delivery partner
    };

    if (req.files?.profilePicture?.[0]) {
      deliveryData.profilePicture = FileService.generateFileObject(
        req.files.profilePicture[0]
      );
    }

    if (req.files?.licenseImage?.[0]) {
      deliveryData.licenseImage = FileService.generateFileObject(
        req.files.licenseImage[0]
      );
    }

    const deliveryPartner = await User.create(deliveryData);

    if (email) {
      const html = renderTemplate(templates.deliveryPartnerCreated, {
        firstName: deliveryPartner.firstName || "Delivery Partner",
        mobNo,
        dob,
        appName: process.env.APP_NAME || "Grocery App",
      });

      await sendEmail(email, "Your Delivery Partner Account Created", html);
    }

    return { success: true, data: deliveryPartner };
  } catch (err) {
    logger.error("Admin Delivery Partner creation error:", err);
    return { success: false, error: err.message };
  }
};

const getAllDeliveryPartners = async (query = {}) => {
  try {
    const partners = await User.find({
      "roles.code": ROLE.DELIVERY_PARTNER,
      ...query,
    })
      .select(
        "firstName lastName email mobNo roles isActive dob status vehicleDetails profilePicture"
      )
      .lean();
    return { success: true, data: partners };
  } catch (err) {
    logger.error("Get delivery partners error:", err);
    return { success: false, error: err.message };
  }
};

const getDeliveryPartnerById = async (id) => {
  try {
    const partner = await User.findOne({
      _id: id,
      "roles.code": ROLE.DELIVERY_PARTNER,
    }).select(
      "firstName lastName email mobNo roles isActive dob status vehicleDetails profilePicture"
    );
    if (!partner)
      return { success: false, error: "Delivery Partner not found" };
    return { success: true, data: partner };
  } catch (err) {
    logger.error("Get delivery partner by ID error:", err);
    return { success: false, error: err.message };
  }
};

const updateDeliveryPartnerByAdmin = async (id, body, files) => {
  try {
    if (!id) return { success: false, notFound: true };

    const partner = await User.findOne({
      _id: id,
      "roles.code": ROLE.DELIVERY_PARTNER,
    }).lean();

    if (!partner)
      return { success: false, error: "Delivery Partner not found" };

    const allowedFields = [
      "firstName",
      "lastName",
      "email",
      "mobNo",
      "dob",
      "gender",
      "vehicleType",
      "driverLicenseNo",
      "vehicleNo",
      "isActive",
      "status",
    ];

    const update = {};
    for (const key of allowedFields) {
      if (
        Object.prototype.hasOwnProperty.call(body, key) &&
        body[key] !== undefined
      ) {
        update[key] = body[key];
      }
    }

    // Vehicle type handling (admin can also toggle between cycle and bike)
    const vehicleType = update.vehicleType || partner.vehicleType;

    if (update.vehicleType === "cycle" && partner.vehicleType === "bike") {
      update.vehicleNo = null;
      update.driverLicenseNo = null;
    }

    if (vehicleType === "bike") {
      const finalVehicleNo = update.vehicleNo || partner.vehicleNo;
      const finalLicenseNo = update.driverLicenseNo || partner.driverLicenseNo;

      if (!finalVehicleNo) {
        return {
          success: false,
          error: "Vehicle number is required for bike type",
        };
      }
      if (!finalLicenseNo) {
        return {
          success: false,
          error: "Driver license number is required for bike type",
        };
      }
    }

    // Handle uploaded files
    if (files?.profilePicture?.[0]) {
      update.profilePicture = FileService.generateFileObject(
        files.profilePicture[0]
      );
    }

    if (files?.vehiclePictures?.length) {
      const vps = files.vehiclePictures.map((f) =>
        FileService.generateFileObject(f)
      );
      update.vehiclePictures = vps;
      update.vehicleDetails =
        update.vehicleDetails || partner.vehicleDetails || {};
      update.vehicleDetails.vehiclePictures = vps;
    }

    if (update.vehicleType || update.vehicleNo || update.driverLicenseNo) {
      update.vehicleDetails =
        update.vehicleDetails || partner.vehicleDetails || {};
      update.vehicleDetails.vehicleType = vehicleType;

      if (vehicleType === "bike") {
        update.vehicleDetails.vehicleNo = update.vehicleNo || partner.vehicleNo;
        update.vehicleDetails.driverLicenseNo =
          update.driverLicenseNo || partner.driverLicenseNo;
      } else {
        delete update.vehicleDetails.vehicleNo;
        delete update.vehicleDetails.driverLicenseNo;
      }
    }

    if (update.vehicleDetails) {
      if (update.vehicleDetails.vehicleType)
        update.vehicleType = update.vehicleDetails.vehicleType;
      if (update.vehicleDetails.vehicleNo)
        update.vehicleNo = update.vehicleDetails.vehicleNo;
      if (update.vehicleDetails.driverLicenseNo)
        update.driverLicenseNo = update.vehicleDetails.driverLicenseNo;
    }

    if (Object.keys(update).length === 0) {
      return { success: false, error: "No fields provided to update" };
    }

    const updated = await User.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true }
    ).lean();

    if (!updated) {
      return {
        success: false,
        error: "Delivery Partner not found or update failed",
      };
    }

    const resp = { _id: updated._id };
    for (const key of Object.keys(update)) {
      if (key === "profilePicture") {
        resp.profilePicture = updated.profilePicture;
      } else if (key === "vehiclePictures" || key === "vehicleDetails") {
        resp.vehiclePictures = updated.vehiclePictures;
        if (Object.prototype.hasOwnProperty.call(update, "vehicleType")) {
          resp.vehicleType = updated.vehicleDetails.vehicleType;
        }
        if (Object.prototype.hasOwnProperty.call(update, "vehicleNo")) {
          resp.vehicleNo = updated.vehicleDetails.vehicleNo;
        }
        if (Object.prototype.hasOwnProperty.call(update, "driverLicenseNo")) {
          resp.driverLicenseNo = updated.vehicleDetails.driverLicenseNo;
        }
      } else {
        resp[key] = updated[key];
      }
    }

    return { success: true, data: resp };
  } catch (err) {
    logger.error("Update delivery partner by admin error:", err);
    return { success: false, error: err.message };
  }
};

const deleteDeliveryPartnerByAdmin = async (id) => {
  try {
    const partner = await User.findOne({
      _id: id,
      "roles.code": ROLE.DELIVERY_PARTNER,
    });
    if (!partner)
      return { success: false, error: "Delivery Partner not found" };

    partner.isActive = false;
    await partner.save();

    return {
      success: true,
      data: { message: "Delivery Partner deactivated successfully" },
    };
  } catch (err) {
    logger.error("Delete delivery partner error:", err);
    return { success: false, error: err.message };
  }
};

//Customer Services
const createCustomerByAdmin = async (req, createdBy) => {
  try {
    const { firstName, lastName, mobNo, roleType, email } = req.body;

    if (!mobNo) return { success: false, error: "Mobile number is required" };
    if (!roleType) return { success: false, error: "Role type is required" };
    if (!firstName) return { success: false, error: "First name is required" };

    const existing = await User.findOne({ mobNo });
    if (existing)
      return { success: false, error: "Mobile number already registered" };

    const customerRole = await Role.findOne({ code: roleType }).lean();
    if (!customerRole?._id)
      return { success: false, error: `${roleType} role not found` };

    const customerData = {
      firstName,
      lastName,
      mobNo,
      email,
      roles: [{ roleId: customerRole._id, code: customerRole.code }],
      isActive: true,
      profileCompleted: 0,
      status: CUSTOMER_STATUS.APPROVED,
      createdBy, //
    };

    if (req.files?.profilePicture?.[0]) {
      customerData.profilePicture = FileService.generateFileObject(
        req.files.profilePicture[0]
      );
    }

    const customer = await User.create(customerData);

    if (email) {
      const html = renderTemplate(templates.customerCreated, {
        firstName,
        mobNo,
        appName: process.env.APP_NAME || "Grocery App",
      });

      await sendEmail(email, "Your Customer Account Created", html);
    }

    return { success: true, data: customer };
  } catch (err) {
    logger.error("Admin Customer creation error:", err);
    return { success: false, error: err.message };
  }
};

const getAllCustomers = async (query = {}) => {
  try {
    const customers = await User.find({ "roles.code": ROLE.CUSTOMER, ...query })
      .select(
        "firstName lastName email mobNo roles isActive status profilePicture"
      )
      .lean();
    return { success: true, data: customers };
  } catch (err) {
    logger.error("Get customers error:", err);
    return { success: false, error: err.message };
  }
};

const getCustomerById = async (id) => {
  try {
    const customer = await User.findOne({
      _id: id,
      "roles.code": ROLE.CUSTOMER,
    }).select(
      "firstName lastName email mobNo roles isActive status profilePicture"
    );
    if (!customer) return { success: false, error: "Customer not found" };
    return { success: true, data: customer };
  } catch (err) {
    logger.error("Get customer by ID error:", err);
    return { success: false, error: err.message };
  }
};

const updateCustomerByAdmin = async (id, body, files) => {
  try {
    if (!id) return { success: false, notFound: true };

    const customer = await User.findOne({
      _id: id,
      "roles.code": ROLE.CUSTOMER,
    }).lean();

    if (!customer) return { success: false, error: "Customer not found" };

    // Admin can update all major fields
    const allowedFields = [
      "firstName",
      "lastName",
      "email",
      "mobNo",
      "dob",
      "gender",
    ];

    const update = {};
    for (const key of allowedFields) {
      if (
        Object.prototype.hasOwnProperty.call(body, key) &&
        body[key] !== undefined
      ) {
        update[key] = body[key];
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
        error: "No fields provided to update",
      };
    }

    let profileCompleted = 20;
    if (update.email || customer.email) profileCompleted += 20;
    if (update.dob || customer.dob) profileCompleted += 20;
    if (update.gender || customer.gender) profileCompleted += 20;
    profileCompleted += 20;
    update.profileCompleted = Math.min(profileCompleted, 100);

    const updated = await User.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true }
    ).lean();

    if (!updated)
      return { success: false, error: "Customer not found or update failed" };

    const resp = { _id: updated._id };
    for (const k of Object.keys(update)) {
      if (k === "profilePicture") {
        resp.profilePicture = updated.profilePicture;
      } else if (k === "dob") {
        resp.dob = formatDate(updated.dob);
      } else if (k === "firstName" || k === "lastName") {
        resp.fullName = `${updated.firstName} ${updated.lastName}`.trim();
        resp.firstName = updated.firstName;
        resp.lastName = updated.lastName;
      } else {
        resp[k] = updated[k];
      }
    }

    return { success: true, data: resp };
  } catch (err) {
    logger.error("Update customer by admin error:", err);
    return { success: false, error: err.message };
  }
};

const deleteCustomerByAdmin = async (id) => {
  try {
    const customer = await User.findOne({
      _id: id,
      "roles.code": ROLE.CUSTOMER,
    });
    if (!customer) return { success: false, error: "Customer not found" };

    customer.isActive = false;
    await customer.save();

    return {
      success: true,
      data: { message: "Customer deactivated successfully" },
    };
  } catch (err) {
    logger.error("Delete customer error:", err);
    return { success: false, error: err.message };
  }
};

const verifyPendingStatus = async (adminId, userId, roleType) => {
  if (!adminId || !userId || !roleType) {
    return { success: false, error: "Missing adminId, userId, or roleType" };
  }

  const checkUsers = await User.findOne({
    _id: userId,
    "roles.code": roleType,
  }).lean();

  if (!checkUsers) return { success: false, error: "Vendor not found" };

  const admin = await User.findById(adminId).lean();
  const allowedAdminRoles = [ROLE.SUPER_ADMIN, ROLE.ADMIN, ROLE.SUB_ADMIN];
  const isAdmin = admin?.roles?.some((r) => allowedAdminRoles.includes(r.code));
  if (!isAdmin) {
    return { success: false, error: "Unauthorized access" };
  }

  const user = await User.findById(userId).lean();
  if (!user) {
    return { success: false, error: "User not found" };
  }

  const userRoleCodes = user.roles.map((r) => r.code);
  if (!userRoleCodes.includes(roleType)) {
    return { success: false, error: `User does not have role: ${roleType}` };
  }

  let update = {};

  if (roleType === ROLE.VENDOR) {
    if (user.status === VENDOR_STATUS.APPROVED) {
      return { success: false, error: "Vendor already approved" };
    }
    update.status = VENDOR_STATUS.APPROVED;
  }

  if (roleType === ROLE.DELIVERY_PARTNER) {
    if (user.status === DELIVERY_PARTNER_STATUS.APPROVED) {
      return { success: false, error: "Delivery Partner already approved" };
    }
    update.status = DELIVERY_PARTNER_STATUS.APPROVED;
  }

  update.verifiedBy = adminId;
  update.verifiedAt = new Date();

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: update },
    { new: true }
  ).lean();

  try {
    // ✅ Prepare and compile MJML email template
    const template = templates.accountVerified
      .replace(/{{firstName}}/g, updatedUser.firstName)
      .replace(/{{mobNo}}/g, updatedUser.mobNo)
      .replace(/{{roleType}}/g, roleType.toLowerCase())
      .replace(/{{appName}}/g, process.env.APP_NAME);

    const { html } = mjml(template, { minify: true });

    // ✅ Send email
    await sendEmail(
      updatedUser.email,
      "Your Account Has Been Verified Successfully",
      html
    );

    logger.info(`✅ Verification email sent to ${updatedUser.email}`);
  } catch (err) {
    logger.error("❌ Email send error:", err.message);
  }

  return { success: true, data: updatedUser.status };
};

module.exports = {
  createVendorByAdmin,
  createDeliveryPartnerByAdmin,
  createCustomerByAdmin,
  getAllVendors,
  getVendorById,
  updateVendorByAdmin,
  deleteVendorByAdmin,
  getAllDeliveryPartners,
  getDeliveryPartnerById,
  updateDeliveryPartnerByAdmin,
  deleteDeliveryPartnerByAdmin,
  getAllCustomers,
  getCustomerById,
  updateCustomerByAdmin,
  deleteCustomerByAdmin,
  verifyPendingStatus,
};
