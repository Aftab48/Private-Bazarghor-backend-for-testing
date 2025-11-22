const { Role } = require("../models/role");
const User = require("../models/user");
const Store = require("../models/store");
const { generateStoreCode } = require("../helpers/utils/genStoreCode");
const { catchAsync } = require("../helpers/utils/catchAsync");
const messages = require("../helpers/utils/messages");
const bcrypt = require("bcrypt");
const {
  ROLE,
  VENDOR_STATUS,
  DELIVERY_PARTNER_STATUS,
  CUSTOMER_STATUS,
} = require("../../config/constants/authConstant");
const FileService = require("./file.service");
const {
  generateToken,
  verifyToken,
  removeToken,
} = require("../helpers/utils/jwt");
const { formatDate } = require("../helpers/utils/date");
const { generateOtp } = require("../helpers/utils/comman");
const moment = require("moment-timezone");
const { renderTemplate, sendNotification } = require("./sendEmail.service");
const templates = require("../templates/emailTemplates.mjml");
const { PERMISSIONS } = require("../../config/constants/permissionConstant");
const { Role: RoleModel } = require("../models/role"); // explicit alias

const createVendor = async (req) => {
  const {
    email,
    firstName,
    lastName,
    mobNo,
    storeName,
    gender,
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

  let storeCode = generateStoreCode();
  let existingStore = await Store.findOne({ storeCode });
  while (existingStore) {
    storeCode = generateStoreCode();
    existingStore = await Store.findOne({ storeCode });
  }

  const vendorData = {
    email,
    firstName,
    lastName,
    mobNo,
    pinCode,
    gender,
    roles: [{ roleId: vendorRole._id, code: vendorRole.code }],
    isActive: true,
    profileCompleted: 0,
    status: VENDOR_STATUS.PENDING,
    termsAndCondition: false,
    cityNm,
  };

  const storeData = {
    vendorId: tempUser._id,
    storeName,
    storeAddress,
    contactNumber: mobNo,
    email,
    storeCode,
    storeStatus: VENDOR_STATUS.PENDING,
    storePictures,
  };

  if (req.files?.profilePicture?.[0]) {
    vendorData.profilePicture = FileService.generateFileObject(
      req.files.profilePicture[0]
    );
  }

  try {
    const store = await Store.create(storeData);
    const vendor = await User.findByIdAndUpdate(
      tempUser._id,
      {
        $set: {
          ...vendorData,
          storeDetails: store._id,
        },
        $unset: { tempRegister: 1 },
      },
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
        store,
        token: tokenData.token,
        refreshToken: tokenData.refreshToken,
        validateTill: tokenData.validateTill,
      },
    };
  } catch (err) {
    FileService.deleteUploadedFiles(req.files);
    return { success: false, error: err.message };
  }
};

const createDeliveryPartner = async (req) => {
  const {
    email,
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
      return {
        success: false,
        error: "License number is required for bike",
      };
    }
  }

  const vehicleDetails = {
    vehicleType,
    vehicleNo: vehicleType === "bike" ? vehicleNo : undefined,
    driverLicenseNo: vehicleType === "bike" ? driverLicenseNo : undefined,
    vehiclePictures: {},
  };

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

  let profilePicture;
  if (req.files?.profilePicture?.[0]) {
    profilePicture = FileService.generateFileObject(
      req.files.profilePicture[0]
    );
  }

  const partnerData = {
    email,
    firstName,
    lastName,
    mobNo,
    dob,
    gender,
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
    return { success: false, error: err.message };
  }
};

const getVendor = async (userId) => {
  if (!userId) return { success: false, notFound: true };

  const user = await User.findById(userId)
    .select(
      "firstName lastName email mobNo profilePicture cityNm pinCode roles termsAndCondition isActive status storeDetails"
    )
    .populate({
      path: "storeDetails",
      select:
        "_id storeCode storeName storeAddress storePictures workingDays contactNumber category deliveryAvailable deliveryRadius minOrderValue rating storeStatus isApproved",
    })
    .lean();

  if (!user) return { success: false, notFound: true };

  return {
    success: true,
    code: "SUCCESS",
    message: "Vendor fetched successfully",
    data: user,
  };
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
const updateVendor = async (vendorId, body, files) => {
  try {
    if (!vendorId) return { success: false, error: "Vendor ID missing" };

    const vendor = await User.findOne({
      _id: vendorId,
      "roles.code": ROLE.VENDOR,
    }).lean();

    if (!vendor) return { success: false, error: "Vendor not found" };

    const userFields = [
      "firstName",
      "lastName",
      "email",
      "mobNo",
      "dob",
      "gender",
      "cityNm",
      "pinCode",
    ];

    const userUpdate = {};
    for (const key of userFields) {
      if (body[key] !== undefined && body[key] !== null) {
        userUpdate[key] = body[key];
      }
    }

    if (files?.profilePicture?.[0]) {
      userUpdate.profilePicture = FileService.generateFileObject(
        files.profilePicture[0]
      );
    }

    let updatedUser = null;
    if (Object.keys(userUpdate).length > 0) {
      updatedUser = await User.findByIdAndUpdate(
        vendorId,
        { $set: userUpdate },
        {
          new: true,
          select:
            "firstName lastName email mobNo cityNm pinCode profilePicture gender dob",
        }
      ).lean();
    }

    const storeFields = [
      "storeName",
      "storeAddress",
      "openingTime",
      "closingTime",
      "workingDays",
      "description",
      "category",
    ];

    const storeUpdate = {};
    for (const key of storeFields) {
      if (body[key] !== undefined && body[key] !== null) {
        storeUpdate[key] = body[key];
      }
    }

    if (files?.storePictures?.length) {
      storeUpdate.storePictures = files.storePictures.map((f) =>
        FileService.generateFileObject(f)
      );
    }

    if (body.mobNo) storeUpdate.contactNumber = body.mobNo;
    if (body.email) storeUpdate.email = body.email;

    let updatedStore = null;
    if (Object.keys(storeUpdate).length > 0) {
      updatedStore = await Store.findOneAndUpdate(
        { vendorId },
        { $set: storeUpdate },
        {
          new: true,
          select:
            "storeName storeAddress openingTime closingTime workingDays contactNumber email description storePictures",
        }
      ).lean();
    }

    const response = {
      _id: vendorId,
      updatedUserFields: userUpdate,
      updatedStoreFields: storeUpdate,
    };

    if (updatedUser) response.user = updatedUser;
    if (updatedStore) response.store = updatedStore;

    return { success: true, data: response };
  } catch (err) {
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
    return { success: false, error: err.message };
  }
};

const createCustomer = async (body, headers) => {
  try {
    const { firstName, lastName, mobNo } = body;

    if (!firstName || !mobNo) {
      return {
        success: false,
        error: "First name, last name, and mobile number are required",
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

    let profileCompleted = 20;
    const customerData = {
      firstName,
      lastName,
      mobNo,
      roles: [{ roleId: customerRole._id, code: customerRole.code }],
      isActive: true,
      profileCompleted,
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
    pinCode,
    landmark,
    addressType,
    isDefault,
  } = body;

  if (!addressLine1 || !city || !state || !pinCode) {
    return {
      success: false,
      error: "Address line 1, city, state, and pinCode are required",
    };
  }

  const customer = await User.findById(userId).lean();
  if (!customer) return { success: false, notFound: true };

  const newAddress = {
    addressLine1,
    addressLine2: addressLine2 || "",
    city,
    state,
    pinCode,
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

  const updatedUser = await User.findById(userId).lean();
  const savedAddress =
    updatedUser.customerAddress[updatedUser.customerAddress.length - 1];

  return { success: true, data: savedAddress };
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

    const user = await User.findOne({ email, isActive: true }).lean();
    if (!user)
      return {
        success: false,
        notFound: true,
        error: "User not found or inactive",
      };

    const allowedRoles = [ROLE.SUPER_ADMIN, ROLE.ADMIN, ROLE.SUB_ADMIN];
    const userRoleCodes = (user.roles || []).map((r) => r.code);
    const matchedRoleCode = userRoleCodes.find((code) =>
      allowedRoles.includes(code)
    );

    if (!matchedRoleCode)
      return {
        success: false,
        forbidden: true,
        error: "Access denied — not an admin account",
      };

    const isPasswordMatched = await User.prototype.isPasswordMatch.call(
      user,
      password
    );
    if (!isPasswordMatched)
      return { success: false, forbidden: true, error: "Incorrect password" };

    const roleDoc = await RoleModel.findOne({ code: matchedRoleCode }).lean();
    if (!roleDoc?._id)
      return {
        success: false,
        notFound: true,
        error: "Role not found in system",
      };

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
      permissions: roleDoc.permissions || [],
    };

    return { success: true, data };
  } catch (error) {
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

    const OTP = generateOtp();
    const expireTime = moment().add(1, "hour").format("YYYY-MM-DD HH:mm:ss");

    await User.findByIdAndUpdate(user._id, {
      resetPassword: {
        code: OTP,
        expireTime: formatDate(expireTime),
      },
    });

    const html = renderTemplate(templates.passwordResetOTP, {
      firstName: user.firstName,
      OTP,
    });

    await sendNotification(
      user.email,
      user.mobNo,
      "Password Reset Request",
      html,
      {
        templateName:
          process.env.WHATSAPP_PASSWORD_RESET_TEMPLATE || "hello_world",
        languageCode: "en_US",
        templateParams: {},
        message: `Hello ${user.firstName}! Your password reset OTP is: ${OTP}. This OTP will expire in 1 hour.`,
      }
    );

    return {
      success: true,
      data: { message: "Reset password OTP sent successfully" },
    };
  } catch (error) {
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

    if (moment().isAfter(moment(formatDate(expireTime))))
      return { success: false, forbidden: true, error: "OTP expired" };

    const result = await setNewPassword(user._id, newPassword, User);
    if (!result) return { success: false, error: "Password reset failed" };

    await User.findByIdAndUpdate(user._id, { $unset: { resetPassword: "" } });

    return {
      success: true,
      data: { message: "Password reset successfully" },
    };
  } catch (error) {
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

const getAggregatedPermissions = async (userId) => {
  if (!userId) return [];
  const user = await User.findById(userId).lean();
  if (!user) return [];
  const roleCodes = (user.roles || []).map((r) => r.code);
  const roles = await RoleModel.find({ code: { $in: roleCodes } })
    .select("permissions")
    .lean();
  return Array.from(new Set(roles.flatMap((r) => r.permissions || [])));
};

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
  getAggregatedPermissions,
};
