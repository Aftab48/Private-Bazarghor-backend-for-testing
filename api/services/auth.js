const { Role } = require("../models/role");
const User = require("../models/user");
const { catchAsync } = require("../helpers/utils/catchAsync");
const messages = require("../helpers/utils/messages");
const {
  ROLE,
  VENDOR_STATUS,
  DELIVERY_PARTNER_STATUS,
} = require("../../config/constants/authConstant");
const FileService = require("../services/file.service");
const logger = require("../helpers/utils/logger");

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

  if (!email || !password) {
    FileService.deleteUploadedFiles(req.files); // cleanup on validation fail
    return messages.insufficientParameters(
      res,
      "Email and password are required"
    );
  }

  const existingUser = await User.findOne({ email: email }).lean();

  if (existingUser) {
    FileService.deleteUploadedFiles(req.files); // cleanup if duplicate email
    return messages.badRequest({}, res, "User with this email already exists");
  }

  const vendorRole = await Role.findOne({ code: ROLE.VENDOR }).lean();
  if (!vendorRole?._id) {
    FileService.deleteUploadedFiles(req.files);
    return messages.recordNotFound(res, "Vendor role not found in system");
  }

  const vendorData = {
    email,
    firstName,
    lastName,
    mobNo,
    passwords: [{ pass: password }],
    roles: [{ roleId: vendorRole._id }],
    isActive: true,
    profileCompleted: 0,
    status: VENDOR_STATUS.PENDING,
    termsAndCondition: false,
    shopname,
    pincode,
    shopaddress,
  };

  // 🖼️ Attach file data if uploaded
  if (req.files?.profilePicture?.[0]) {
    vendorData.profilePicture = FileService.generateFileObject(
      req.files.profilePicture[0]
    );
  }

  if (req.files?.storePicture?.[0]) {
    vendorData.storePicture = FileService.generateFileObject(
      req.files.storePicture[0]
    );
  }

  try {
    const vendor = await User.create(vendorData);
    return messages.successResponse(vendor, res, "Vendor created successfully");
  } catch (err) {
    // ⚠️ if DB save fails, clean up uploaded files
    FileService.deleteUploadedFiles(req.files);
    console.error("Vendor creation error:", err);
    return messages.failureResponse(err, res);
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

  // 🔹 Basic validation
  if (!email || !password) {
    FileService.deleteUploadedFiles(req.files);
    return messages.insufficientParameters(
      res,
      "Email and password are required"
    );
  }

  // 🔹 Check for existing partner
  const existingUser = await User.findOne({ email: email }).lean();
  if (existingUser) {
    FileService.deleteUploadedFiles(req.files);
    return messages.badRequest({}, res, "User with this email already exists");
  }

  const vehicleNoCheck = await User.findOne({
    vehicleNo: vehicleNo,
  }).lean();
  if (vehicleNoCheck) {
    return messages.badRequest({}, res, "Vehicle number already registered");
  }

  const driverLicenseNoCheck = await User.findOne({
    driverLicenseNo: driverLicenseNo,
  }).lean();
  if (driverLicenseNoCheck) {
    return messages.badRequest(
      {},
      res,
      "Driver license number already registered"
    );
  }

  // 🔹 Get delivery partner role
  const deliveryRole = await Role.findOne({
    code: ROLE.DELIVERY_PARTNER,
  }).lean();
  if (!deliveryRole?._id) {
    FileService.deleteUploadedFiles(req.files);
    return messages.recordNotFound(res, "Delivery Partner role not found");
  }

  // 🧱 Prepare delivery partner data
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
    roles: [{ roleId: deliveryRole._id }],
    isActive: true,
    profileCompleted: 0,
    status: DELIVERY_PARTNER_STATUS.PENDING,
    termsAndCondition: false,
  };

  // 🖼️ Attach uploaded images if available
  if (req.files?.vehiclePictures?.length) {
    partnerData.vehiclePictures = req.files.vehiclePictures.map((file) =>
      FileService.generateFileObject(file)
    );
  }

  // 💾 Save partner
  try {
    const partner = await User.create(partnerData);
    return messages.successResponse(
      partner,
      res,
      "Delivery Partner registered successfully"
    );
  } catch (err) {
    FileService.deleteUploadedFiles(req.files);
    logger.error("Delivery Partner creation error:", err);
    return messages.failureResponse(err, res);
  }
});

module.exports = { createVendor, createDeliveryPartner };
