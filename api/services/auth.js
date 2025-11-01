const { Role } = require("../models/role");
const User = require("../models/user");
const { catchAsync } = require("../helpers/utils/catchAsync");
const messages = require("../helpers/utils/messages");
const bcrypt = require("bcrypt");
const {
  ROLE,
  VENDOR_STATUS,
  DELIVERY_PARTNER_STATUS,
  CUSTOMER_STATUS,
} = require("../../config/constants/authConstant");
const FileService = require("../services/file.service");
const {
  generateToken,
  verifyToken,
  removeToken,
} = require("../helpers/utils/jwt");
const { formatDate } = require("../helpers/utils/date");
const { generateOTP } = require("../helpers/utils/comman");
const moment = require("moment-timezone");
const { sendEmail, renderTemplate } = require("../services/send.email");
const templates = require("../templates/emailTemplates.mjml");

const createVendor = async (req) => {
  const {
    email,
    // password,
    firstName,
    lastName,
    mobNo,
    storeName,
    pinCode,
    storeAddress,
    cityNm,
  } = req.body;

  if (!email) {
    FileService.deleteUploadedFiles(req.files);
    return { success: false, error: "Email is required" };
  }

  const user = await User.findOne({ email });
  if (user) {
    FileService.deleteUploadedFiles(req.files);
    return { success: false, error: "Email is already registered" };
  }

  const tempUser = await User.findOne({
    mobNo,
    tempRegister: true,
    mobVerifiedAt: { $exists: true },
  })
    .sort({ updatedAt: -1 })
    .lean();

  if (!tempUser) {
    FileService.deleteUploadedFiles(req.files);
    return { success: false, error: "Please verify your mobile number first" };
  }

  const vendorRole = await Role.findOne({ code: ROLE.VENDOR }).lean();
  if (!vendorRole?._id) {
    FileService.deleteUploadedFiles(req.files);
    return { success: false, error: "Vendor role not found in system" };
  }

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
    // passwords: [{ pass: password }],
    roles: [{ roleId: vendorRole._id, code: vendorRole.code }],
    isActive: true,
    profileCompleted: 0,
    status: VENDOR_STATUS.PENDING,
    termsAndCondition: false,
    cityNm: cityNm,
    storeDetails: {
      storeName: storeName,
      storeAddress: storeAddress,
      storePictures,
    },
  };

  if (req.files?.profilePicture?.[0]) {
    vendorData.profilePicture = FileService.generateFileObject(
      req.files.profilePicture[0]
    );
  }

  try {
    const vendor = await User.findByIdAndUpdate(
      tempUser._id,
      { $set: vendorData, $unset: { tempRegister: 1 } },
      { new: true }
    );

    const tokenData = await generateToken(
      vendor,
      req.headers["user-agent"] || "Unknown Device"
    );

    return {
      success: true,
      data: {
        vendor,
        token: tokenData.token,
        refreshToken: tokenData.refreshToken,
        validateTill: tokenData.validateTill,
      },
    };
  } catch (err) {
    FileService.deleteUploadedFiles(req.files);
    logger.error("Vendor creation error:", err);
    return { success: false, error: err.message };
  }
};

const createDeliveryPartner = async (req) => {
  const {
    email,
    // password,
    firstName,
    lastName,
    mobNo,
    dob,
    gender,
    vehicleType,
    driverLicenseNo,
    vehicleNo,
  } = req.body;

  if (!email) {
    FileService.deleteUploadedFiles(req.files);
    return { success: false, error: "Email is required" };
  }

  const existingEmail = await User.findOne({ email });
  if (existingEmail) {
    FileService.deleteUploadedFiles(req.files);
    return { success: false, error: "Email is already registered" };
  }

  const tempUser = await User.findOne({
    mobNo,
    tempRegister: true,
    mobVerifiedAt: { $exists: true },
  })
    .sort({ updatedAt: -1 })
    .lean();

  if (!tempUser) {
    FileService.deleteUploadedFiles(req.files);
    return { success: false, error: "Please verify your mobile number first" };
  }

  const deliveryRole = await Role.findOne({
    code: ROLE.DELIVERY_PARTNER,
  }).lean();

  if (!deliveryRole?._id) {
    FileService.deleteUploadedFiles(req.files);
    return { success: false, error: "Delivery Partner role not found" };
  }

  if (vehicleType === "bike") {
    if (!vehicleNo) {
      FileService.deleteUploadedFiles(req.files);
      return { success: false, error: "Vehicle number is required for bike" };
    }
    if (!driverLicenseNo) {
      FileService.deleteUploadedFiles(req.files);
      return { success: false, error: "License number is required for bike" };
    }
  }

  const vehicleDetails = {
    vehicleType,
    vehicleNo: vehicleType === "bike" ? vehicleNo : undefined,
    driverLicenseNo: vehicleType === "bike" ? driverLicenseNo : undefined,
    vehiclePictures: {},
  };

  // ✅ Handle vehicle pictures (front/back)
  if (req.files?.vehicleFront?.[0]) {
    vehicleDetails.vehiclePictures.front = FileService.generateFileObject(
      req.files.vehicleFront[0]
    );
  }
  if (req.files?.vehicleBack?.[0]) {
    vehicleDetails.vehiclePictures.back = FileService.generateFileObject(
      req.files.vehicleBack[0]
    );
  }

  // ✅ Profile picture
  let profilePicture;
  if (req.files?.profilePicture?.[0]) {
    profilePicture = FileService.generateFileObject(
      req.files.profilePicture[0]
    );
  }

  // ✅ Build user data
  const partnerData = {
    email,
    firstName,
    lastName,
    mobNo,
    dob,
    gender,
    // passwords: [{ pass: password }],
    roles: [{ roleId: deliveryRole._id, code: deliveryRole.code }],
    isActive: true,
    profileCompleted: 0,
    status: DELIVERY_PARTNER_STATUS.PENDING,
    termsAndCondition: false,
    vehicleDetails,
  };

  if (profilePicture) partnerData.profilePicture = profilePicture;

  try {
    const partner = await User.findByIdAndUpdate(
      tempUser._id,
      { $set: partnerData, $unset: { tempRegister: 1 } },
      { new: true }
    ).lean();

    const tokenData = await generateToken(
      partner,
      req.headers["user-agent"] || "Unknown Device"
    );

    return {
      success: true,
      data: {
        partner: {
          _id: partner._id,
          firstName: partner.firstName,
          lastName: partner.lastName,
          email: partner.email,
          mobNo: partner.mobNo,
          gender: partner.gender,
          dob: formatDate(partner.dob),
          vehicleType: partner.vehicleDetails?.vehicleType,
          vehicleNo: partner.vehicleDetails?.vehicleNo,
          driverLicenseNo: partner.vehicleDetails?.driverLicenseNo,
          vehiclePictures: partner.vehicleDetails?.vehiclePictures,
          profilePicture: partner.profilePicture,
        },
        token: tokenData.token,
        refreshToken: tokenData.refreshToken,
        validateTill: tokenData.validateTill,
      },
    };
  } catch (err) {
    FileService.deleteUploadedFiles(req.files);
    logger.error("Delivery Partner creation error:", err);
    return { success: false, error: err.message };
  }
};

const getVendor = async (userId) => {
  if (!userId) return { success: false, notFound: true };

  const user = await User.findById(userId)
    .select(
      "-passwords -tokens -offNotification -canChangePass -updatedBy -consentAgree -isPrimaryAdmin -createdAt -updatedAt"
    )
    .lean();

  if (!user) return { success: false, notFound: true };

  return { success: true, data: user };
};

const getDeliveryPartner = async (userId) => {
  if (!userId) return { success: false, notFound: true };

  const user = await User.findById(userId)
    .select(
      "-passwords -tokens -offNotification -canChangePass -updatedBy -consentAgree -isPrimaryAdmin -createdAt -updatedAt"
    )
    .lean();

  if (!user) return { success: false, notFound: true };

  return { success: true, data: user };
};

const updateVendor = async (userId, body, files) => {
  if (!userId) return { success: false, notFound: true };

  const user = await User.findById(userId).lean();
  if (!user) return { success: false, notFound: true };

  const allowedFields = ["firstName", "lastName", "email", "dob", "gender"];
  const update = {};

  for (const key of allowedFields) {
    if (
      Object.prototype.hasOwnProperty.call(body, key) &&
      body[key] !== undefined
    ) {
      update[key] = body[key];
    }
  }

  const storeAllowed = ["storeName", "storeAddress"];
  for (const key of storeAllowed) {
    if (
      Object.prototype.hasOwnProperty.call(body, key) &&
      body[key] !== undefined
    ) {
      update.storeDetails = update.storeDetails || user.storeDetails || {};
      update.storeDetails[key] = body[key];
    }
  }

  // ✅ file uploads
  if (files?.profilePicture?.[0]) {
    update.profilePicture = FileService.generateFileObject(
      files.profilePicture[0]
    );
  }

  if (files?.storePictures?.length) {
    const storePics = files.storePictures.map((f) =>
      FileService.generateFileObject(f)
    );
    update.storeDetails = update.storeDetails || user.storeDetails || {};
    update.storeDetails.storePictures = storePics;
  }

  if (Object.keys(update).length === 0) {
    return { success: false, error: "No fields provided to update" };
  }

  try {
    const updated = await User.findByIdAndUpdate(
      userId,
      { $set: update },
      { new: true }
    ).lean();

    const resp = { _id: updated._id };

    // ✅ dynamic loop-based response
    for (const k of Object.keys(update)) {
      if (k === "storeDetails") {
        resp.storeDetails = {};
        for (const sd of Object.keys(update.storeDetails)) {
          resp.storeDetails[sd] = updated.storeDetails?.[sd];
        }
      } else if (k === "profilePicture") {
        resp.profilePicture = updated.profilePicture;
      } else {
        resp[k] = updated[k];
      }
    }

    return { success: true, data: resp };
  } catch (err) {
    logger.error("Vendor update error:", err);
    return { success: false, error: err.message };
  }
};

const updateDeliveryPartner = async (userId, body, files) => {
  if (!userId) return { success: false, notFound: true };

  const user = await User.findById(userId).lean();
  if (!user) return { success: false, notFound: true };

  const allowedFields = [
    "firstName",
    "lastName",
    "email",
    "dob",
    "gender",
    "partnerAddress",
    "cityNm",
    "pinCode",
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

  const vehicleFields = ["vehicleType", "vehicleNo", "driverLicenseNo"];
  for (const key of vehicleFields) {
    if (
      Object.prototype.hasOwnProperty.call(body, key) &&
      body[key] !== undefined
    ) {
      update.vehicleDetails =
        update.vehicleDetails || user.vehicleDetails || {};
      update.vehicleDetails[key] = body[key];
    }
  }

  const vType =
    update.vehicleDetails?.vehicleType || user.vehicleDetails?.vehicleType;
  if (vType === "bike") {
    const vNo =
      update.vehicleDetails?.vehicleNo || user.vehicleDetails?.vehicleNo;
    const lNo =
      update.vehicleDetails?.driverLicenseNo ||
      user.vehicleDetails?.driverLicenseNo;

    if (!vNo)
      return { success: false, error: "Vehicle number required for bike" };
    if (!lNo)
      return { success: false, error: "License number required for bike" };
  }

  // ✅ files
  if (files?.profilePicture?.[0]) {
    update.profilePicture = FileService.generateFileObject(
      files.profilePicture[0]
    );
  }
  update.vehicleDetails = user.vehicleDetails || {};

  if (files?.vehicleFront?.[0]) {
    update.vehicleDetails.vehiclePictures = {
      ...user.vehicleDetails.vehiclePictures,
      front: FileService.generateFileObject(files.vehicleFront[0]),
    };
  }

  if (files?.vehicleBack?.[0]) {
    update.vehicleDetails.vehiclePictures = {
      ...user.vehicleDetails.vehiclePictures,
      back: FileService.generateFileObject(files.vehicleBack[0]),
    };
  }
  if (Object.keys(update).length === 0) {
    return { success: false, error: "No fields provided to update" };
  }

  try {
    const updated = await User.findByIdAndUpdate(
      userId,
      { $set: update },
      { new: true }
    ).lean();

    const resp = { _id: updated._id };
    for (const k of Object.keys(update)) {
      if (k === "profilePicture") {
        resp.profilePicture = updated.profilePicture;
      } else if (k === "vehicleDetails.vehiclePictures") {
        resp.vehicleDetails = resp.vehicleDetails || {};
        resp.vehicleDetails.vehiclePictures = {
          front: updated?.vehicleDetails?.vehiclePictures?.vehicleFront,
          back: updated?.vehicleDetails?.vehiclePictures?.vehicleBack,
        };
        if (Object.prototype.hasOwnProperty.call(update, "vehicleType")) {
          resp.vehicleType = updated.vehicleType;
        }
        if (Object.prototype.hasOwnProperty.call(update, "vehicleNo")) {
          resp.vehicleNo = updated.vehicleNo;
        }
        if (Object.prototype.hasOwnProperty.call(update, "driverLicenseNo")) {
          resp.driverLicenseNo = updated.driverLicenseNo;
        }
      } else if (k === "dob") {
        resp.dob = formatDate(updated.dob);
      } else {
        resp[k] = updated[k];
      }
    }
    return { success: true, data: resp };
  } catch (err) {
    logger.error("Delivery Partner update error:", err);
    return { success: false, error: err.message };
  }
};

const createCustomer = async (body, headers) => {
  try {
    const { fullName, mobNo } = body;

    if (!fullName || !mobNo) {
      return {
        success: false,
        error: "Full name and mobile number are required",
      };
    }

    const tempQuery = {
      mobNo,
      tempRegister: true,
      mobVerifiedAt: { $exists: true },
    };
    const tempUser = await User.findOne(tempQuery)
      .sort({ updatedAt: -1 })
      .lean();

    if (!tempUser) {
      return {
        success: false,
        error: "Please verify your mobile number first",
      };
    }

    const existingUser = await User.findOne({
      mobNo,
      _id: { $ne: tempUser._id },
      tempRegister: { $ne: true },
    }).lean();

    if (existingUser) {
      return {
        success: false,
        error: "Mobile number already registered",
        conflicts: [
          {
            field: "mobNo",
            value: existingUser.mobNo,
            message: "Mobile number already registered",
          },
        ],
      };
    }

    const customerRole = await Role.findOne({ code: ROLE.CUSTOMER }).lean();
    if (!customerRole?._id) {
      return { success: false, error: "Customer role not found in system" };
    }

    const nameParts = fullName.trim().split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || "";

    const customerData = {
      firstName,
      lastName,
      mobNo,
      roles: [{ roleId: customerRole._id, code: customerRole.code }],
      isActive: true,
      profileCompleted: 20,
      status: CUSTOMER_STATUS.APPROVED,
      termsAndCondition: true,
      customerAddress: [],
    };

    const customer = await User.findByIdAndUpdate(
      tempUser._id,
      { $set: customerData, $unset: { tempRegister: 1 } },
      { new: true }
    );

    const tokenData = await generateToken(
      customer,
      headers["user-agent"] || "Unknown Device"
    );

    return {
      success: true,
      data: {
        customer: {
          _id: customer._id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          fullName: `${customer.firstName} ${customer.lastName}`.trim(),
          mobNo: customer.mobNo,
          roles: customer.roles,
          profileCompleted: customer.profileCompleted,
          email: customer.email,
          dob: customer.dob,
          gender: customer.gender,
          customerAddress: customer.customerAddress,
        },
        token: tokenData.token,
        refreshToken: tokenData.refreshToken,
        validateTill: tokenData.validateTill,
      },
    };
  } catch (err) {
    logger.error("Customer creation error:", err);
    return { success: false, error: err.message };
  }
};

const getCustomer = async (userId) => {
  if (!userId) return { success: false, notFound: true };

  const user = await User.findById(userId)
    .select(
      "-passwords -tokens -offNotification -canChangePass -updatedBy -consentAgree -isPrimaryAdmin -createdAt -updatedAt"
    )
    .lean();

  if (!user) return { success: false, notFound: true };
  return { success: true, data: user };
};

const updateCustomer = async (userId, body, files) => {
  if (!userId) return { success: false, notFound: true };
  const user = await User.findById(userId).lean();
  if (!user) return { success: false, notFound: true };

  const allowedFields = ["firstName", "lastName", "email", "dob", "gender"];

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
      notFound: true,
      error: "No fields provided to update",
    };
  }

  let profileCompleted = 20;
  if (update.email) profileCompleted += 20;
  if (update.dob) profileCompleted += 20;
  if (update.gender) profileCompleted += 20;
  profileCompleted += 20;

  update.profileCompleted = Math.min(profileCompleted, 100);

  const updated = await User.findByIdAndUpdate(
    userId,
    { $set: update },
    { new: true }
  ).lean();

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

  try {
    await User.findByIdAndUpdate(userId, update, {
      new: true,
    }).lean();
    return { success: true, data: resp };
  } catch (err) {
    logger.error("Customer update error:", err);
    return { success: false, error: err.message };
  }
};

const addCustomerAddress = async (userId, body) => {
  if (!userId) return { success: false, notFound: true };
  const {
    addressLine1,
    addressLine2,
    city,
    state,
    pincode,
    landmark,
    addressType,
    isDefault,
  } = body;

  if (!addressLine1 || !city || !state || !pincode) {
    return {
      success: false,
      error: "Address line 1, city, state, and pincode are required",
    };
  }

  const customer = await User.findById(userId).lean();
  if (!customer) return { success: false, notFound: true };

  const newAddress = {
    addressLine1,
    addressLine2: addressLine2 || "",
    city,
    state,
    pincode,
    landmark: landmark || "",
    addressType: addressType || "home",
    isDefault: isDefault || false,
  };

  if (isDefault) {
    const updatedAddresses = customer.customerAddress.map((addr) => ({
      ...addr,
      isDefault: false,
    }));
    updatedAddresses.push(newAddress);

    await User.findByIdAndUpdate(userId, { customerAddress: updatedAddresses });
  } else {
    await User.findByIdAndUpdate(userId, {
      $push: { customerAddress: newAddress },
    });
  }

  return { success: true, data: newAddress };
};

const updateCustomerAddress = async (userId, addressId, body) => {
  if (!userId) return { success: false, notFound: true };
  if (!addressId) return { success: false, error: "Address ID is required" };

  const customer = await User.findById(userId).lean();
  if (!customer) return { success: false, notFound: true };

  const cleanAddressId = String(addressId).trim();
  const addressIndex = customer.customerAddress.findIndex(
    (addr) => String(addr._id) === cleanAddressId
  );
  if (addressIndex === -1)
    return { success: false, error: "Address not found" };

  const currentAddr = customer.customerAddress[addressIndex];
  const updatedAddress = {
    ...currentAddr,
    ...body,
  };

  let updatedAddresses;
  if (body.isDefault) {
    updatedAddresses = customer.customerAddress.map((addr, i) => ({
      ...addr,
      isDefault: i === addressIndex,
    }));
  } else {
    updatedAddresses = [...customer.customerAddress];
    updatedAddresses[addressIndex] = updatedAddress;
  }

  await User.findByIdAndUpdate(userId, { customerAddress: updatedAddresses });
  return { success: true, data: updatedAddress };
};

const deleteCustomerAddress = async (userId, addressId) => {
  if (!userId) return { success: false, notFound: true };
  if (!addressId) return { success: false, error: "Address ID is required" };

  const customer = await User.findById(userId).lean();
  if (!customer) return { success: false, notFound: true };

  const addressExists = customer.customerAddress.some(
    (addr) => addr._id.toString() === addressId
  );

  if (!addressExists) return { success: false, error: "Address not found" };

  await User.findByIdAndUpdate(userId, {
    $pull: { customerAddress: { _id: addressId } },
  });
  return { success: true };
};

const adminLoginService = async (email, password, userAgent) => {
  try {
    if (!email || !password) {
      return {
        success: false,
        validation: true,
        error: "Email and Password are required",
      };
    }

    // find user
    const user = await User.findOne({ email, isActive: true }).lean();
    if (!user)
      return {
        success: false,
        notFound: true,
        error: "User not found or inactive",
      };

    // allowed admin roles
    const allowedRoles = [ROLE.SUPER_ADMIN, ROLE.ADMIN, ROLE.SUB_ADMIN];

    // extract user roles
    const userRoleCodes = (user.roles || []).map((r) => r.code);

    // check if any role is allowed
    const matchedRoleCode = userRoleCodes.find((code) =>
      allowedRoles.includes(code)
    );

    if (!matchedRoleCode)
      return {
        success: false,
        forbidden: true,
        error: "Access denied — not an admin account",
      };

    // validate password
    const isPasswordMatched = await User.prototype.isPasswordMatch.call(
      user,
      password
    );
    if (!isPasswordMatched)
      return { success: false, forbidden: true, error: "Incorrect password" };

    // find full role info from DB (for completeness)
    const roleDoc = await Role.findOne({ code: matchedRoleCode }).lean();
    if (!roleDoc?._id)
      return {
        success: false,
        notFound: true,
        error: "Role not found in system",
      };

    // generate token
    const tokenData = await generateToken(user, userAgent || "Unknown Device");

    const data = {
      id: user._id,
      email: user.email,
      mobNo: user.mobNo,
      name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      roles: [{ roleId: roleDoc._id, code: matchedRoleCode }],
      token: tokenData.token,
      refreshToken: tokenData.refreshToken,
      validateTill: tokenData.validateTill,
      isPrimaryAdmin: matchedRoleCode === ROLE.SUPER_ADMIN,
    };

    return { success: true, data };
  } catch (error) {
    logger.error("Admin login error:", error);
    return { success: false, error: error.message };
  }
};

const getAdmins = async (userId) => {
  if (!userId) return { success: false, notFound: true };

  const user = await User.findById(userId)
    .select(
      "-passwords -tokens -offNotification -canChangePass -__v -tempRegistration -updatedBy -consentAgree  -createdAt -updatedAt -vehicleDetails  -storeDetails -shopaddress -shopname -tempRegister -mobVerify -resetPassword -customFields -gender -cityNm -vehicleNo -customerAddress"
    )
    .lean();

  if (!user) return { success: false, notFound: true };

  return { success: true, data: user };
};

const updateAdmin = async (targetUserId, body, files, currentUser) => {
  try {
    if (!targetUserId) {
      return { success: false, notFound: true, error: "User ID missing" };
    }

    const targetUser = await User.findById(targetUserId).lean();
    if (!targetUser) {
      return { success: false, notFound: true, error: "Admin not found" };
    }

    const user = await User.findById(currentUser).lean();
    if (!user) {
      return { success: false, error: "Unauthorized: User not found" };
    }

    const userRoles = user.roles.map((r) => r.code);
    const targetRoles = targetUser.roles.map((r) => r.code);

    if (userRoles.includes(ROLE.SUPER_ADMIN)) {
      if (
        targetRoles.includes(ROLE.SUPER_ADMIN) &&
        user._id.toString() !== targetUserId
      ) {
        return {
          success: false,
          error: "Super Admin cannot update another Super Admin",
        };
      }
    } else if (userRoles.includes(ROLE.ADMIN)) {
      if (!targetRoles.includes(ROLE.SUB_ADMIN)) {
        return {
          success: false,
          error: "Admin can only update Sub Admin details",
        };
      }
    } else if (userRoles.includes(ROLE.SUB_ADMIN)) {
      if (user._id.toString() !== targetUserId) {
        return {
          success: false,
          error: "Sub Admin can only update their own profile",
        };
      }
    } else {
      return { success: false, error: "Unauthorized access" };
    }

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
      targetUserId,
      { $set: update },
      { new: true }
    )
      .select("_id firstName lastName email mobNo profilePicture roles")
      .lean();

    if (!updatedUser) {
      return { success: false, error: "Failed to update admin" };
    }

    const resp = { _id: updatedUser._id };
    for (const key of Object.keys(update)) {
      resp[key] = updatedUser[key];
    }

    return { success: true, data: resp };
  } catch (err) {
    logger.error("Admin update error:", err);
    FileService.deleteUploadedFiles(files);
    return { success: false, error: err.message };
  }
};

const setNewPassword = async (id, newPassword, User) => {
  try {
    await User.updateOne(
      { _id: id, "passwords.isActive": true },
      { $set: { "passwords.$.isActive": false } }
    );

    const hashedPassword = await bcrypt.hash(newPassword, 8);
    const passwordObj = {
      pass: hashedPassword,
      salt: hashedPassword.slice(7, 29),
      isActive: true,
      createdAt: new Date(),
    };

    await User.updateOne(
      { _id: id },
      {
        $push: { passwords: passwordObj },
        $set: { canChangePass: true },
      }
    );

    return true;
  } catch (error) {
    logger.error("❌ Error in setNewPassword:", error);
    throw error;
  }
};

const forgotPassword = async (email) => {
  try {
    const user = await User.findOne({
      email,
      deletedAt: { $exists: false },
    }).select("-passwords -tokens");

    if (!user)
      return { success: false, notFound: true, error: "User not found" };
    if (!user.isActive)
      return {
        success: false,
        forbidden: true,
        error: "User account is deactivated",
      };

    const OTP = generateOTP();
    const expireTime = moment().add(1, "hour").format("YYYY-MM-DD HH:mm:ss");

    await User.findByIdAndUpdate(user._id, {
      resetPassword: { code: OTP, expireTime },
    });

    const html = renderTemplate(templates.passwordResetOTP, {
      firstName: user.firstName,
      OTP,
    });

    await sendEmail(user.email, "Password Reset Request", html);

    return {
      success: true,
      data: { message: "Reset password OTP sent successfully" },
    };
  } catch (error) {
    logger.error("Forgot password error:", error);
    return { success: false, error: error.message };
  }
};

const resetPassword = async (email, otp, newPassword) => {
  try {
    const user = await User.findOne({ email });
    if (!user)
      return { success: false, notFound: true, error: "User not found" };

    const { code, expireTime } = user.resetPassword || {};
    if (!code || code !== otp)
      return { success: false, forbidden: true, error: "Invalid OTP" };

    if (moment().isAfter(moment(expireTime)))
      return { success: false, forbidden: true, error: "OTP expired" };

    const result = await setNewPassword(user._id, newPassword, User);
    if (!result) return { success: false, error: "Password reset failed" };

    await User.findByIdAndUpdate(user._id, { $unset: { resetPassword: "" } });

    return { success: true, data: { message: "Password reset successfully" } };
  } catch (error) {
    logger.error("Reset password error:", error);
    return { success: false, error: error.message };
  }
};

const changePassword = async (userId, oldPassword, newPassword) => {
  try {
    if (!oldPassword || !newPassword)
      return {
        success: false,
        validation: true,
        error: "Old and new password are required",
      };

    const user = await User.findById(userId);
    if (!user)
      return { success: false, notFound: true, error: "User not found" };

    const isMatch = await user.isPasswordMatch(oldPassword);
    if (!isMatch)
      return {
        success: false,
        forbidden: true,
        error: "Old password incorrect",
      };

    const result = await setNewPassword(user._id, newPassword, User);
    if (!result) return { success: false, error: "Failed to update password" };

    return {
      success: true,
      data: { message: "Password changed successfully" },
    };
  } catch (error) {
    logger.error("Change admin password error:", error);
    return { success: false, error: error.message };
  }
};

const logoutUser = catchAsync(async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return messages.unAuthorizedRequest("Authorization token missing", res);
  }
  const token = authHeader.split(" ")[1];
  const decoded = await verifyToken(token);
  if (!decoded) {
    return messages.unAuthorizedRequest("Invalid or expired token", res);
  }
  await removeToken(decoded.id, token);
  return messages.logoutSuccessful(
    { message: "Logged out" },
    res,
    "Logged out successfully"
  );
});

module.exports = {
  createVendor,
  createDeliveryPartner,
  createCustomer,
  logoutUser,
  getVendor,
  getDeliveryPartner,
  getCustomer,
  updateVendor,
  updateDeliveryPartner,
  updateCustomer,
  adminLoginService,
  changePassword,
  resetPassword,
  forgotPassword,
  updateCustomerAddress,
  deleteCustomerAddress,
  addCustomerAddress,
  setNewPassword,
  getAdmins,
  updateAdmin,
};
