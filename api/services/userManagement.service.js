const User = require("../models/user");
const { Role } = require("../models/role");
const Store = require("../models/store");
const VendorSubscription = require("../models/vendorSubscription");
const { generateStoreCode } = require("../helpers/utils/genStoreCode");
const {
  VENDOR_STATUS,
  DELIVERY_PARTNER_STATUS,
  CUSTOMER_STATUS,
  ROLE,
} = require("../../config/constants/authConstant");
const { renderTemplate, sendNotification } = require("./sendEmail.service");
const FileService = require("./file.service");
const templates = require("../templates/emailTemplates.mjml");
const { assignFreeTrial } = require("./vendorSubscription.service");
const mapplsService = require("./map-pls.service");

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
      gender,
      roleType, // e.g. "VENDOR"
      cityNm,
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
      cityNm,
      roles: [{ roleId: vendorRole._id, code: vendorRole.code }],
      isActive: true,
      profileCompleted: 0,
      status: VENDOR_STATUS.PENDING,
      termsAndCondition: false,
      createdBy,
    };

    if (req.files?.profilePicture?.[0]) {
      vendorData.profilePicture = FileService.generateFileObject(
        req.files.profilePicture[0]
      );
    }

    const vendor = await User.create(vendorData);
    const storeData = {
      vendorId: vendor._id,
      storeCode,
      storeName,
      storeAddress,
      contactNumber: mobNo,
      email,
      storePictures,
      storeStatus: VENDOR_STATUS.PENDING,
    };

    const resolvedLocation = await mapplsService
      .resolveCoordinatesFromAddress({
        address: storeAddress,
        city: cityNm,
        pincode: pinCode,
      })
      .catch(() => null);

    if (resolvedLocation?.lat && resolvedLocation?.lng) {
      storeData.location = {
        lat: resolvedLocation.lat,
        lng: resolvedLocation.lng,
      };
    }

    const store = await Store.create(storeData);
    vendor.storeDetails = store._id;
    await vendor.save();

    if (email) {
      const html = renderTemplate(templates.vendorCreated, {
        firstName,
        mobNo,
      });
      // Send both email and WhatsApp notification
      await sendNotification(
        email,
        mobNo,
        "Your Vendor Account is Created",
        html,
        {
          message: `Hello ${firstName}! Your vendor account has been created successfully. Welcome to BazarGhorr!`,
        }
      );
    }

    return {
      success: true,
      code: "SUCCESS",
      message: "Vendor created successfully",
      data: {
        _id: vendor._id,
        firstName: vendor.firstName,
        lastName: vendor.lastName,
        email: vendor.email,
        mobNo: vendor.mobNo,
        storeDetails: {
          storeCode: store.storeCode,
          storeName: store.storeName,
          storeAddress: store.storeAddress,
        },
      },
    };
  } catch (err) {
    logger.error("Admin Vendor creation error:", err);
    FileService.deleteUploadedFiles(req.files);
    return { success: false, error: err.message };
  }
};

const getAllVendors = async (query = {}) => {
  try {
    const stores = await Store.find(query)
      .populate({
        path: "vendorId",
        match: { "roles.code": ROLE.VENDOR },
        select:
          "firstName lastName email mobNo roles isActive status profilePicture",
      })
      .lean();

    const filteredStores = stores.filter((s) => s.vendorId);

    return { success: true, data: filteredStores };
  } catch (err) {
    logger.error("Get all vendors error:", err);
    return { success: false, error: err.message };
  }
};

const getVendorById = async (id) => {
  try {
    const store = await Store.findOne({ vendorId: id })
      .populate({
        path: "vendorId",
        match: { "roles.code": ROLE.VENDOR },
        select:
          "firstName lastName email mobNo roles isActive status profilePicture",
      })
      .lean();

    if (!store) return { success: false, error: "Vendor not found" };

    return { success: true, data: store };
  } catch (err) {
    logger.error("Get vendor by ID error:", err);
    return { success: false, error: err.message };
  }
};
const updateVendorByAdmin = async (id, body, files) => {
  try {
    if (!id) return { success: false, error: "Vendor ID missing" };

    const vendor = await User.findOne({
      _id: id,
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
      "isActive",
      "status",
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
        id,
        { $set: userUpdate },
        {
          new: true,
          select:
            "firstName lastName email mobNo cityNm pinCode profilePicture isActive status",
        }
      ).lean();
    }

    const storeFields = [
      "storeName",
      "storeAddress",
      "openingTime",
      "closingTime",
      "workingDays",
      "contactNumber",
      "email",
      "description",
      "storeStatus",
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

    if (
      body.location &&
      (body.location.lat !== undefined || body.location.lng !== undefined)
    ) {
      const lat = Number(body.location.lat);
      const lng = Number(body.location.lng);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        storeUpdate.location = { lat, lng };
      }
    }

    if (
      storeUpdate.storeAddress &&
      (!storeUpdate.location ||
        storeUpdate.location.lat === undefined ||
        storeUpdate.location.lng === undefined)
    ) {
      const resolvedLocation = await mapplsService
        .resolveCoordinatesFromAddress({
          address: storeUpdate.storeAddress,
          city: body.cityNm || vendor.cityNm,
          pincode: body.pinCode || vendor.pinCode,
        })
        .catch(() => null);

      if (resolvedLocation?.lat && resolvedLocation?.lng) {
        storeUpdate.location = {
          lat: resolvedLocation.lat,
          lng: resolvedLocation.lng,
        };
      }
    }

    let updatedStore = null;
    if (Object.keys(storeUpdate).length > 0) {
      updatedStore = await Store.findOneAndUpdate(
        { vendorId: id },
        { $set: storeUpdate },
        {
          new: true,
          select:
            "storeName storeAddress contactNumber email storePictures storeStatus location",
        }
      ).lean();
    }

    const response = {
      _id: id,
      updatedUserFields: userUpdate,
      updatedStoreFields: storeUpdate,
    };

    if (updatedUser) response.user = updatedUser;
    if (updatedStore) response.store = updatedStore;

    return { success: true, data: response };
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

      // Send both email and WhatsApp notification
      await sendNotification(
        email,
        mobNo,
        "Your Delivery Partner Account Created",
        html,
        {
          message: `Hello ${
            deliveryPartner.firstName || "Delivery Partner"
          }! Your delivery partner account has been created successfully. Welcome to BazarGhorr!`,
        }
      );
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

      // Send both email and WhatsApp notification
      await sendNotification(
        email,
        mobNo,
        "Your Customer Account Created",
        html,
        {
          message: `Hello ${firstName}! Your customer account has been created successfully. Welcome to BazarGhorr!`,
        }
      );
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

  const user = await User.findOne({
    _id: userId,
    "roles.code": roleType,
  }).lean();

  if (!user) return { success: false, error: "User not found" };

  const admin = await User.findById(adminId).lean();
  const allowedAdminRoles = [ROLE.SUPER_ADMIN, ROLE.ADMIN];

  if (!admin?.roles?.some((r) => allowedAdminRoles.includes(r.code))) {
    return { success: false, error: "Unauthorized access" };
  }

  const update = {};
  const storeUpdate = {};

  const isCurrentlyApproved =
    user.status === VENDOR_STATUS.APPROVED ||
    user.status === DELIVERY_PARTNER_STATUS.APPROVED;

  if (isCurrentlyApproved) {
    update.status =
      roleType === ROLE.VENDOR
        ? VENDOR_STATUS.PENDING
        : DELIVERY_PARTNER_STATUS.PENDING;

    update.verifiedBy = null;
    update.verifiedAt = null;

    storeUpdate.storeStatus = VENDOR_STATUS.PENDING;
    storeUpdate.isApproved = false;
  } else {
    update.status =
      roleType === ROLE.VENDOR
        ? VENDOR_STATUS.APPROVED
        : DELIVERY_PARTNER_STATUS.APPROVED;

    update.verifiedBy = adminId;
    update.verifiedAt = new Date();

    storeUpdate.storeStatus = VENDOR_STATUS.APPROVED;
    storeUpdate.isApproved = true;
  }

  if (roleType === ROLE.VENDOR && user.storeDetails) {
    await Store.findByIdAndUpdate(
      user.storeDetails,
      { $set: storeUpdate },
      { new: true }
    );
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: update },
    { new: true }
  ).lean();

  if (!isCurrentlyApproved && roleType === ROLE.VENDOR) {
    try {
      const existingSub = await VendorSubscription.findOne({
        vendorId: userId,
      });

      if (!existingSub) {
        await assignFreeTrial(userId, user.storeDetails);
        logger.info("🎉 Free Trial Assigned to new vendor!");
      } else {
        logger.info("⏭️ Vendor already has subscription. Free trial skipped.");
      }
    } catch (err) {
      logger.error("❌ Free trial assignment error:", err.message);
    }
  }

  if (!isCurrentlyApproved) {
    try {
      const { email, firstName, mobNo } = updatedUser;

      if (email) {
        const html = renderTemplate(templates.accountVerified, {
          firstName,
          mobNo,
          roleType,
        });

        await sendNotification(
          email,
          mobNo,
          "Your Account Has Been Verified",
          html,
          {
            message: `Hello ${firstName}! Your ${roleType} account has been verified successfully. Free trial activated!`,
          }
        );
      }
    } catch (err) {
      logger.error("❌ Email send error:", err.message);
    }
  }

  return {
    success: true,
    data: {
      status: updatedUser.status,
      isApproved: storeUpdate.isApproved ?? null,
      message: isCurrentlyApproved
        ? "Unapproved successfully (mail not sent)"
        : "Approved successfully + Free Trial Assigned",
    },
  };
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
