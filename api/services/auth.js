const { Role } = require("../models/role");
const User = require("../models/user");
const { catchAsync } = require("../helpers/utils/catchAsync");
const messages = require("../helpers/utils/messages");
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

const createVendor = catchAsync(async (req, res) => {
  const {
    email,
    password,
    firstName,
    lastName,
    mobNo,
    shopname,
    pincode,
    shopaddress,
  } = req.body;

  if (!email) {
    FileService.deleteUploadedFiles(req.files);
    return messages?.insufficientParameters(res, "Email is required");
  }

  const tempQuery = {
    mobNo,
    tempRegister: true,
    mobVerifiedAt: { $exists: true },
  };
  const tempUser = await User.findOne(tempQuery).sort({ updatedAt: -1 }).lean();
  if (!tempUser) {
    FileService.deleteUploadedFiles(req.files);
    return messages.badRequest(
      { message: "Please verify your mobile number first" },
      res,
      "Mobile verification required"
    );
  }

  const existingUser = await User.findOne({
    email,
    _id: { $ne: tempUser._id },
  }).lean();
  if (existingUser) {
    FileService.deleteUploadedFiles(req.files);

    const conflicts = [
      {
        field: "email",
        value: existingUser.email,
        message: "Email already registered",
      },
    ];

    logger.info(
      "Vendor registration conflict fields:",
      conflicts.map((c) => c.field).join(", ")
    );

    return messages?.badRequest(
      { error: conflicts },
      res,
      conflicts[0].message
    );
  }

  const vendorRole = await Role.findOne({ code: ROLE.VENDOR }).lean();
  if (!vendorRole?._id) {
    FileService.deleteUploadedFiles(req.files);
    return messages?.recordNotFound(res, "Vendor role not found in system");
  }

  const vendorData = {
    email,
    firstName,
    lastName,
    mobNo,
    passwords: [{ pass: password }],
    roles: [{ roleId: vendorRole._id, code: vendorRole?.code }],
    isActive: true,
    profileCompleted: 0,
    status: VENDOR_STATUS.PENDING,
    termsAndCondition: false,
    pincode,
    storeDetails: {
      storeName: shopname,
      storeAddress: shopaddress,
      storePictures: [],
    },
  };

  if (req.files?.profilePicture?.[0]) {
    vendorData.profilePicture = FileService.generateFileObject(
      req.files.profilePicture[0]
    );
  }

  if (req.files?.storePicture?.[0]) {
    const sp = FileService.generateFileObject(req.files.storePicture[0]);
    vendorData.storePicture = sp;
    vendorData.storeDetails.storePictures = [sp];
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

    return messages?.successResponse(
      {
        vendor: {
          _id: vendor._id,
          firstName: vendor.firstName,
          lastName: vendor.lastName,
          email: vendor.email,
          mobNo: vendor.mobNo,
          roles: vendor.roles,
          profileCompleted: vendor.profileCompleted,
          shopname: vendor.shopname,
          shopaddress: vendor.shopaddress,
          pincode: vendor.pincode,
        },
        token: tokenData.token,
        refreshToken: tokenData.refreshToken,
        validateTill: tokenData.validateTill,
      },
      res,
      "Vendor registered successfully"
    );
  } catch (err) {
    FileService.deleteUploadedFiles(req.files);
    logger.error("Vendor creation error:", err);
    return messages?.failureResponse(err, res);
  }
});

const createDeliveryPartner = catchAsync(async (req, res) => {
  const {
    email,
    password,
    firstName,
    lastName,
    mobNo,
    dob,
    gender,
    driverLicenseNo,
    vehicleNo,
  } = req.body;

  if (!email) {
    FileService.deleteUploadedFiles(req.files);
    return messages.insufficientParameters(res, "Email is required");
  }

  const tempQuery = {
    mobNo,
    tempRegister: true,
    mobVerifiedAt: { $exists: true },
  };
  const tempUser = await User.findOne(tempQuery).sort({ updatedAt: -1 }).lean();
  if (!tempUser) {
    FileService.deleteUploadedFiles(req.files);
    return messages.badRequest(
      { message: "Please verify your mobile number first" },
      res,
      "Mobile verification required"
    );
  }

  const orConditions = [{ email }];
  if (vehicleNo) orConditions.push({ vehicleNo });
  if (driverLicenseNo) orConditions.push({ driverLicenseNo });

  const existingUser = await User.findOne({
    $or: orConditions,
    _id: { $ne: tempUser._id },
  }).lean();
  if (existingUser) {
    FileService.deleteUploadedFiles(req.files);

    const conflicts = [];
    if (existingUser.email === email) {
      conflicts.push({
        field: "email",
        value: existingUser.email,
        message: "Email already registered",
      });
    }
    if (mobNo && existingUser.mobNo === mobNo) {
      conflicts.push({
        field: "mobNo",
        value: existingUser.mobNo,
        message: "Mobile number already registered",
      });
    }
    if (vehicleNo && existingUser.vehicleNo === vehicleNo) {
      conflicts.push({
        field: "vehicleNo",
        value: existingUser.vehicleNo,
        message: "Vehicle number already registered",
      });
    }
    if (driverLicenseNo && existingUser.driverLicenseNo === driverLicenseNo) {
      conflicts.push({
        field: "driverLicenseNo",
        value: existingUser.driverLicenseNo,
        message: "Driver license number already registered",
      });
    }

    logger.info(
      "Registration conflict fields:",
      conflicts.map((c) => c.field).join(", ")
    );
    const messageText =
      conflicts.length === 1
        ? conflicts[0].message
        : "One or more fields already registered";

    return messages.badRequest({ error: conflicts }, res, messageText);
  }

  const deliveryRole = await Role.findOne({
    code: ROLE.DELIVERY_PARTNER,
  }).lean();
  if (!deliveryRole?._id) {
    FileService.deleteUploadedFiles(req.files);
    return messages.recordNotFound(res, "Delivery Partner role not found");
  }

  const partnerData = {
    email,
    firstName,
    lastName,
    mobNo,
    dob,
    gender,
    driverLicenseNo,
    vehicleNo,
    passwords: [{ pass: password }],
    roles: [{ roleId: deliveryRole._id, code: deliveryRole?.code }],
    isActive: true,
    profileCompleted: 0,
    status: DELIVERY_PARTNER_STATUS.PENDING,
    termsAndCondition: false,
  };

  if (req.files?.vehiclePictures?.length) {
    const vps = req.files.vehiclePictures.map((file) =>
      FileService.generateFileObject(file)
    );
    partnerData.vehiclePictures = vps;
    partnerData.vehicleDetails = {
      vehicleNo,
      driverLicenseNo,
      vehiclePictures: vps,
    };
  }

  try {
    const partner = await User.findByIdAndUpdate(
      tempUser._id,
      { $set: partnerData, $unset: { tempRegister: 1 } },
      { new: true }
    );
    const tokenData = await generateToken(
      partner,
      req.headers["user-agent"] || "Unknown Device"
    );

    return messages?.successResponse(
      {
        partner: {
          _id: partner._id,
          firstName: partner.firstName,
          lastName: partner.lastName,
          email: partner.email,
          mobNo: partner.mobNo,
          roles: partner.roles,
          profileCompleted: partner.profileCompleted,
          vehicleNo: partner.vehicleNo,
          driverLicenseNo: partner.driverLicenseNo,
          dob: formatDate(partner.dob),
          gender: partner.gender,
        },
        token: tokenData.token,
        refreshToken: tokenData.refreshToken,
        validateTill: tokenData.validateTill,
      },
      res,
      "Delivery Partner registered successfully"
    );
  } catch (err) {
    FileService.deleteUploadedFiles(req.files);
    logger.error("Delivery Partner creation error:", err);
    return messages.failureResponse(err, res);
  }
});

const getVendor = async (userId) => {
  if (!userId) return null;
  return await User.findById(userId)
    .select(
      "-passwords -tokens -offNotification -canChangePass -updatedBy -consentAgree -isPrimaryAdmin -isPrimaryAdmin -createdAt -updatedAt"
    )
    .lean();
};

const getDeliveryPartner = async (userId) => {
  if (!userId) return null;
  return await User.findById(userId)
    .select(
      "-passwords -tokens -offNotification -canChangePass -updatedBy -consentAgree -isPrimaryAdmin -isPrimaryAdmin -createdAt -updatedAt"
    )
    .lean();
};

// Partial update for vendor profile
// Partial update for vendor profile
const updateVendor = async (userId, body, files, res) => {
  if (!userId) return messages.recordNotFound(res, "User not found");

  const user = await User.findById(userId).lean();
  if (!user) return messages.recordNotFound(res, "User not found");

  const allowedFields = [
    "firstName",
    "lastName",
    "email",
    "shopname",
    "pincode",
    "shopaddress",
    // keep mobNo editing off until later
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

  // files handling
  if (files?.profilePicture?.[0]) {
    update.profilePicture = FileService.generateFileObject(
      files.profilePicture[0]
    );
  }
  if (files?.storePicture?.[0]) {
    const sp = FileService.generateFileObject(files.storePicture[0]);
    update.storePicture = sp;
    // also sync nested storeDetails
    update.storeDetails = update.storeDetails || {};
    update.storeDetails.storePictures = [sp];
  }

  if (Object.keys(update).length === 0) {
    return messages.badRequest(
      { error: "No updatable fields provided" },
      res,
      "No fields provided to update"
    );
  }

  const updated = await User.findByIdAndUpdate(
    userId,
    { $set: update },
    { new: true }
  ).lean();

  // Build response only with fields that were actually updated
  const resp = { _id: updated._id };
  for (const k of Object.keys(update)) {
    if (k === "profilePicture") {
      resp.profilePicture = updated.profilePicture;
    } else if (k === "storePicture") {
      resp.storePicture = updated.storePicture;
    } else if (k === "storeDetails") {
      // if storeDetails was sent, prefer store-related flat fields if present
      if (update.storeDetails.storeName) resp.shopname = updated.shopname;
      if (update.storeDetails.storeAddress)
        resp.shopaddress = updated.shopaddress;
      if (update.storeDetails.storePictures)
        resp.storeDetails = {
          storePictures: updated.storeDetails?.storePictures || [],
        };
    } else {
      resp[k] = updated[k];
    }
  }

  return messages?.successResponse(
    { vendor: resp },
    res,
    "Vendor profile updated successfully"
  );
};

// Partial update for delivery partner profile
const updateDeliveryPartner = async (userId, body, files, res) => {
  if (!userId) return messages.recordNotFound(res, "User not found");

  const user = await User.findById(userId).lean();
  if (!user) return messages.recordNotFound(res, "User not found");

  const allowedFields = [
    "firstName",
    "lastName",
    "email",
    "dob",
    "gender",
    "driverLicenseNo",
    "vehicleNo",
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

  // files handling - allow multiple vehicle pictures
  if (files?.vehiclePictures?.length) {
    const vps = files.vehiclePictures.map((f) =>
      FileService.generateFileObject(f)
    );
    update.vehiclePictures = vps;
    update.vehicleDetails = update.vehicleDetails || {};
    update.vehicleDetails.vehiclePictures = vps;
  }
  if (files?.profilePicture?.[0]) {
    update.profilePicture = FileService.generateFileObject(
      files.profilePicture[0]
    );
  }

  // if nothing to update
  if (Object.keys(update).length === 0) {
    return messages.badRequest(
      { error: "No updatable fields provided" },
      res,
      "No fields provided to update"
    );
  }

  // sync flat vehicle and driver fields from vehicleDetails if provided
  if (update.vehicleDetails) {
    if (update.vehicleDetails.vehicleNo)
      update.vehicleNo = update.vehicleDetails.vehicleNo;
    if (update.vehicleDetails.driverLicenseNo)
      update.driverLicenseNo = update.vehicleDetails.driverLicenseNo;
  }

  const updated = await User.findByIdAndUpdate(
    userId,
    { $set: update },
    { new: true }
  ).lean();

  // Build response only with fields that were actually updated
  const resp = { _id: updated._id };
  for (const k of Object.keys(update)) {
    if (k === "profilePicture") {
      resp.profilePicture = updated.profilePicture;
    } else if (k === "vehiclePictures" || k === "vehicleDetails") {
      resp.vehiclePictures = updated.vehiclePictures;
      // also include flat vehicle/driver fields if they were updated
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

  return messages?.successResponse(
    { partner: resp },
    res,
    "Delivery Partner profile updated successfully"
  );
};

const createCustomer = catchAsync(async (req, res) => {
  const { fullName, mobNo } = req.body;

  if (!fullName || !mobNo) {
    return messages.insufficientParameters(
      res,
      "Full name and mobile number are required"
    );
  }

  const tempQuery = {
    mobNo,
    tempRegister: true,
    mobVerifiedAt: { $exists: true },
  };
  const tempUser = await User.findOne(tempQuery).sort({ updatedAt: -1 }).lean();
  if (!tempUser) {
    return messages.badRequest(
      { message: "Please verify your mobile number first" },
      res,
      "Mobile verification required"
    );
  }

  const existingUser = await User.findOne({
    mobNo,
    _id: { $ne: tempUser._id },
    tempRegister: { $ne: true },
  }).lean();
  if (existingUser) {
    return messages.badRequest(
      {
        error: [
          {
            field: "mobNo",
            value: existingUser.mobNo,
            message: "Mobile number already registered",
          },
        ],
      },
      res,
      "Mobile number already registered"
    );
  }

  const customerRole = await Role.findOne({ code: ROLE.CUSTOMER }).lean();
  if (!customerRole?._id) {
    return messages.recordNotFound(res, "Customer role not found in system");
  }

  // Split full name into first and last name
  const nameParts = fullName.trim().split(" ");
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(" ") || "";

  const customerData = {
    firstName,
    lastName,
    mobNo,
    roles: [{ roleId: customerRole._id, code: customerRole?.code }],
    isActive: true,
    profileCompleted: 20, // Basic profile completed with name and mobile
    status: CUSTOMER_STATUS.APPROVED, // Auto approve customers
    termsAndCondition: true,
    customerAddress: [], // Empty array initially
  };

  try {
    const customer = await User.findByIdAndUpdate(
      tempUser._id,
      { $set: customerData, $unset: { tempRegister: 1 } },
      { new: true }
    );

    const tokenData = await generateToken(
      customer,
      req.headers["user-agent"] || "Unknown Device"
    );

    return messages?.successResponse(
      {
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
      res,
      "Customer registered successfully"
    );
  } catch (err) {
    logger.error("Customer creation error:", err);
    return messages?.failureResponse(err, res);
  }
});

const getCustomer = async (userId) => {
  if (!userId) return null;
  return await User.findById(userId)
    .select(
      "-passwords -tokens -offNotification -canChangePass -updatedBy -consentAgree -isPrimaryAdmin -createdAt -updatedAt"
    )
    .lean();
};

const updateCustomer = async (userId, body, files, res) => {
  if (!userId) return messages.recordNotFound(res, "User not found");

  const user = await User.findById(userId).lean();
  if (!user) return messages.recordNotFound(res, "User not found");

  const allowedFields = [
    "firstName",
    "lastName",
    "email",
    "dob",
    "gender",
    "customerAddress",
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

  // Handle customerAddress updates
  if (update.customerAddress && Array.isArray(update.customerAddress)) {
    // Ensure only one default address
    const hasDefault = update.customerAddress.some((addr) => addr.isDefault);
    if (hasDefault) {
      update.customerAddress = update.customerAddress.map((addr) => ({
        ...addr,
        isDefault: addr.isDefault || false,
      }));
    }
  }

  // Handle file uploads
  if (files?.profilePicture?.[0]) {
    update.profilePicture = FileService.generateFileObject(
      files.profilePicture[0]
    );
  }

  if (Object.keys(update).length === 0) {
    return messages.badRequest(
      { error: "No updatable fields provided" },
      res,
      "No fields provided to update"
    );
  }

  // Calculate profile completion percentage
  let profileCompleted = 20; // Base for name and mobile
  if (update.email) profileCompleted += 20;
  if (update.dob) profileCompleted += 20;
  if (update.gender) profileCompleted += 20;
  if (update.customerAddress && update.customerAddress.length > 0)
    profileCompleted += 20;

  update.profileCompleted = Math.min(profileCompleted, 100);

  const updated = await User.findByIdAndUpdate(
    userId,
    { $set: update },
    { new: true }
  ).lean();

  // Build response only with fields that were actually updated
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

  return messages?.successResponse(
    { customer: resp },
    res,
    "Customer profile updated successfully"
  );
};

const adminLoginService = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return messages.insufficientParameters(res, "Email and Password are required");
  }
  const user = await User.findOne({ email, isActive: true });
 
  if (!user) {
    return messages.recordNotFound(res, "Admin not found");
  }
  const adminRole = await Role.findOne({ code: ROLE.SUPER_ADMIN }).lean();
  if (!adminRole?._id) {
    return messages.recordNotFound(res, "Admin role not found in system");
  }

  const isPasswordMatched = await user.isPasswordMatch(password);
  if (!isPasswordMatched) {
    return messages.wrongPassword(res,  "Incorrect password");
  }
  try {
    const tokenData = await generateToken(
      user,
      req.headers["user-agent"] || "Unknown Device"
    );

  const data = {
    id: user._id,
    email: user.email,
    mobNo: user.mobNo,
    name: `${user.firstName} ${user.lastName}`,
    roles: [{ roleId: adminRole._id, code: adminRole?.code }],
    token: tokenData.token,
    refreshToken: tokenData.refreshToken,
    validateTill: tokenData.validateTill,
  };

  return messages.loginSuccess(data, res, {message: "Admin logged in successfully"});
  } catch (error) {
    logger.error("Error logging in admin: ", error);
    return messages.internalServerError(res, {message: "Error logging in admin"});
  }
});



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
  return messages.logoutSuccessfull(
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
  adminLoginService
};
