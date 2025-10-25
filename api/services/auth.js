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
const { sendEmail } = require("../services/send.email");

const createVendor = async (req) => {
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
    return { success: false, error: "Email is required" };
  }

  const user = await User.findOne({ email });
  if (user) {
    FileService.deleteUploadedFiles(req.files);
    return { success: false, error: "Email is already registered" };
  }

  const tempQuery = {
    mobNo,
    tempRegister: true,
    mobVerifiedAt: { $exists: true },
  };
  const tempUser = await User.findOne(tempQuery).sort({ updatedAt: -1 }).lean();
  if (!tempUser) {
    FileService.deleteUploadedFiles(req.files);
    return { success: false, error: "Please verify your mobile number first" };
  }

  const existingUser = await User.findOne({
    email,
    _id: { $ne: tempUser._id },
  }).lean();
  if (existingUser) {
    FileService.deleteUploadedFiles(req.files);
    return { success: false, error: "Email already registered" };
  }

  const vendorRole = await Role.findOne({ code: ROLE.VENDOR }).lean();
  if (!vendorRole?._id) {
    FileService.deleteUploadedFiles(req.files);
    return { success: false, error: "Vendor role not found in system" };
  }

  // Prepare vendor data
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
    vendorData.storePictures = sp;
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

    return {
      success: true,
      data: {
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
    password,
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

  const user = await User.findOne({ email });
  if (user) {
    FileService.deleteUploadedFiles(req.files);
    return { success: false, error: "Email is already registered" };
  }

  const tempQuery = {
    mobNo,
    tempRegister: true,
    mobVerifiedAt: { $exists: true },
  };
  const tempUser = await User.findOne(tempQuery).sort({ updatedAt: -1 }).lean();
  if (!tempUser) {
    FileService.deleteUploadedFiles(req.files);
    return { success: false, error: "Please verify your mobile number first" };
  }

  const orConditions = [{ email }];
  // Only check for vehicle/license conflicts if vehicleType is bike
  if (vehicleType === "bike") {
    if (vehicleNo) orConditions.push({ vehicleNo });
    if (driverLicenseNo) orConditions.push({ driverLicenseNo });
  }

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
    if (vehicleType === "bike" && vehicleNo && existingUser.vehicleNo === vehicleNo) {
      conflicts.push({
        field: "vehicleNo",
        value: existingUser.vehicleNo,
        message: "Vehicle number already registered",
      });
    }
    if (vehicleType === "bike" && driverLicenseNo && existingUser.driverLicenseNo === driverLicenseNo) {
      conflicts.push({
        field: "driverLicenseNo",
        value: existingUser.driverLicenseNo,
        message: "Driver license number already registered",
      });
    }

    const messageText =
      conflicts.length === 1
        ? conflicts[0].message
        : "One or more fields already registered";

    return { success: false, error: messageText, conflicts };
  }

  const deliveryRole = await Role.findOne({
    code: ROLE.DELIVERY_PARTNER,
  }).lean();

  if (!deliveryRole?._id) {
    FileService.deleteUploadedFiles(req.files);
    return { success: false, error: "Delivery Partner role not found" };
  }

  const partnerData = {
    email,
    firstName,
    lastName,
    mobNo,
    dob,
    gender,
    vehicleType,
    passwords: [{ pass: password }],
    roles: [{ roleId: deliveryRole._id, code: deliveryRole?.code }],
    isActive: true,
    profileCompleted: 0,
    status: DELIVERY_PARTNER_STATUS.PENDING,
    termsAndCondition: false,
  };

  // Only add vehicle and license details if vehicleType is bike
  if (vehicleType === "bike") {
    partnerData.driverLicenseNo = driverLicenseNo;
    partnerData.vehicleNo = vehicleNo;
  }

  if (req.files?.vehiclePictures?.length) {
    const vps = req.files.vehiclePictures.map((file) =>
      FileService.generateFileObject(file)
    );
    partnerData.vehiclePictures = vps;
    partnerData.vehicleDetails = {
      vehicleType,
      vehiclePictures: vps,
    };
    
    // Only add vehicle and license to vehicleDetails if type is bike
    if (vehicleType === "bike") {
      partnerData.vehicleDetails.vehicleNo = vehicleNo;
      partnerData.vehicleDetails.driverLicenseNo = driverLicenseNo;
    }
  } else if (vehicleType === "bike") {
    // Create vehicleDetails even without pictures for bike
    partnerData.vehicleDetails = {
      vehicleType,
      vehicleNo,
      driverLicenseNo,
      vehiclePictures: [],
    };
  } else {
    // For cycle, just store the vehicle type
    partnerData.vehicleDetails = {
      vehicleType,
      vehiclePictures: [],
    };
  }

  if (req.files?.profilePicture?.[0]) {
    partnerData.profilePicture = FileService.generateFileObject(
      req.files.profilePicture[0]
    );
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

    const responseData = {
      partner: {
        _id: partner._id,
        firstName: partner.firstName,
        lastName: partner.lastName,
        email: partner.email,
        mobNo: partner.mobNo,
        roles: partner.roles,
        profileCompleted: partner.profileCompleted,
        vehicleType: partner.vehicleType,
        dob: formatDate(partner.dob),
        gender: partner.gender,
      },
      token: tokenData.token,
      refreshToken: tokenData.refreshToken,
      validateTill: tokenData.validateTill,
    };

    // Only include vehicle details in response if vehicleType is bike
    if (partner.vehicleType === "bike") {
      responseData.partner.vehicleNo = partner.vehicleNo;
      responseData.partner.driverLicenseNo = partner.driverLicenseNo;
    }

    return {
      success: true,
      data: responseData,
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

  const allowedFields = [
    "firstName",
    "lastName",
    "email",
    "shopname",
    "pincode",
    "shopaddress",
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
  if (files?.storePictures?.[0]) {
    const sp = FileService.generateFileObject(files.storePictures[0]);
    update.storePictures = sp;
    update.storeDetails = update.storeDetails || {};
    update.storeDetails.storePictures = [sp];
  }

  if (Object.keys(update).length === 0) {
    return {
      success: false,
      notFound: true,
      error: "No fields provided to update",
    };
  }

  const updated = await User.findByIdAndUpdate(
    userId,
    { $set: update },
    { new: true }
  ).lean();

  const resp = { _id: updated._id };
  for (const k of Object.keys(update)) {
    if (k === "profilePicture") {
      resp.profilePicture = updated.profilePicture;
    } else if (k === "storePicture") {
      resp.storePicture = updated.storePicture;
    } else if (k === "storeDetails") {
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

  try {
    await User.findByIdAndUpdate(userId, update, {
      new: true,
    }).lean();
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
    "vehicleType",
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

  // Determine the vehicle type (use updated value or existing)
  const vehicleType = update.vehicleType || user.vehicleType;

  // If changing to cycle from bike, clear vehicle and license fields
  if (update.vehicleType === "cycle" && user.vehicleType === "bike") {
    update.vehicleNo = null;
    update.driverLicenseNo = null;
  }

  // Validate that bike users provide vehicle and license details
  if (vehicleType === "bike") {
    const finalVehicleNo = update.vehicleNo || user.vehicleNo;
    const finalLicenseNo = update.driverLicenseNo || user.driverLicenseNo;
    
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

  // files handling - allow multiple vehicle pictures
  if (files?.vehiclePictures?.length) {
    const vps = files.vehiclePictures.map((f) =>
      FileService.generateFileObject(f)
    );
    update.vehiclePictures = vps;
    update.vehicleDetails = update.vehicleDetails || user.vehicleDetails || {};
    update.vehicleDetails.vehiclePictures = vps;
  }
  if (files?.profilePicture?.[0]) {
    update.profilePicture = FileService.generateFileObject(
      files.profilePicture[0]
    );
  }

  // if nothing to update
  if (Object.keys(update).length === 0) {
    return {
      success: false,
      notFound: true,
      error: "No fields provided to update",
    };
  }

  // Update vehicleDetails to match vehicleType
  if (update.vehicleType || update.vehicleNo || update.driverLicenseNo) {
    update.vehicleDetails = update.vehicleDetails || user.vehicleDetails || {};
    update.vehicleDetails.vehicleType = vehicleType;
    
    if (vehicleType === "bike") {
      update.vehicleDetails.vehicleNo = update.vehicleNo || user.vehicleNo;
      update.vehicleDetails.driverLicenseNo = update.driverLicenseNo || user.driverLicenseNo;
    } else {
      // For cycle, remove vehicle and license from vehicleDetails
      delete update.vehicleDetails.vehicleNo;
      delete update.vehicleDetails.driverLicenseNo;
    }
  }

  // sync flat vehicle and driver fields from vehicleDetails if provided
  if (update.vehicleDetails) {
    if (update.vehicleDetails.vehicleType)
      update.vehicleType = update.vehicleDetails.vehicleType;
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

  const resp = { _id: updated._id };
  for (const k of Object.keys(update)) {
    if (k === "profilePicture") {
      resp.profilePicture = updated.profilePicture;
    } else if (k === "vehiclePictures" || k === "vehicleDetails") {
      resp.vehiclePictures = updated.vehiclePictures;
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

  try {
    await User.findByIdAndUpdate(userId, update, {
      new: true,
    }).lean();
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

const updateCustomer = async (userId, body, files, res) => {
  if (!userId) return { success: false, notFound: true };
  const user = await User.findById(userId).lean();
  if (!user) return { success: false, notFound: true };

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

  if (update.customerAddress && Array.isArray(update.customerAddress)) {
    const hasDefault = update.customerAddress.some((addr) => addr.isDefault);
    if (hasDefault) {
      update.customerAddress = update.customerAddress.map((addr) => ({
        ...addr,
        isDefault: addr.isDefault || false,
      }));
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

    const user = await User.findOne({ email, isActive: true });
    if (!user)
      return { success: false, notFound: true, error: "Admin not found" };

    const adminRole = await Role.findOne({ code: ROLE.SUPER_ADMIN }).lean();
    if (!adminRole?._id)
      return {
        success: false,
        notFound: true,
        error: "Admin role not found in system",
      };

    const isPasswordMatched = await user.isPasswordMatch(password);
    if (!isPasswordMatched)
      return { success: false, forbidden: true, error: "Incorrect password" };

    const tokenData = await generateToken(user, userAgent || "Unknown Device");

    const data = {
      id: user._id,
      email: user.email,
      mobNo: user.mobNo,
      name: `${user.firstName} ${user.lastName}`,
      roles: [{ roleId: adminRole._id, code: adminRole.code }],
      token: tokenData.token,
      refreshToken: tokenData.refreshToken,
      validateTill: tokenData.validateTill,
    };

    return { success: true, data };
  } catch (error) {
    logger.error("Admin login error:", error);
    return { success: false, error: error.message };
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

    const html = `
      <div style="font-family:sans-serif;line-height:1.6">
        <h3>Hello ${user.firstName || user.name || "User"},</h3>
        <p>Your password reset OTP is:</p>
        <h2>${OTP}</h2>
        <p>This OTP will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `;

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
};
