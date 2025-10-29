const User = require("../models/user");
const { Role } = require("../models/role");
const {
  VENDOR_STATUS,
  DELIVERY_PARTNER_STATUS,
  CUSTOMER_STATUS,
  ROLE,
} = require("../../config/constants/authConstant");
const { sendEmail } = require("../services/send.email");
const FileService = require("../services/file.service");

//Vendors Services
const createVendorByAdmin = async (req, createdBy) => {
  try {
    const {
      email,
      firstName,
      lastName,
      mobNo,
      shopname,
      pincode,
      shopaddress,
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

    const vendorData = {
      email,
      firstName,
      lastName,
      mobNo,
      pincode,
      roles: [{ roleId: vendorRole._id, code: vendorRole.code }],
      isActive: true,
      profileCompleted: 0,
      status: VENDOR_STATUS.APPROVED,
      termsAndCondition: false,
      storeDetails: {
        storeName: shopname,
        storeAddress: shopaddress,
        storePictures: [],
      },
      createdBy, // 🟢 Store the ID of the creator
    };

    if (req.files?.profilePicture?.[0]) {
      vendorData.profilePicture = FileService.generateFileObject(
        req.files.profilePicture[0]
      );
    }

    if (req.files?.storePicture?.[0]) {
      const sp = FileService.generateFileObject(req.files.storePicture[0]);
      vendorData.storeDetails.storePictures = [sp];
    }

    const vendor = await User.create(vendorData);

    const html = `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <h2 style="color: #2c3e50;">Your account has been created 🎉</h2>
    <h3>Hello ${vendor.firstName || "Vendor"},</h3>
    <p>You can now login using your mobile number:</p>
    <p><strong>Mobile No:</strong> ${mobNo}</p>
    <p style="margin-top: 20px; font-size: 14px; color: #666;">
        <p style="margin-top: 20px; font-size: 14px; color: #666;">
          You can now log in using your registered mobile number.<br/>
          Thank you for joining us!<br/>
      Thank you for joining us!  
      <br/>${process.env.APP_NAME || "Team"}
    </p>
  </div>
`;

    await sendEmail(email, "Your Vendor Account Details", html);
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
    if (!id) return { success: false, notFound: true };

    const vendor = await User.findOne({
      _id: id,
      "roles.code": ROLE.VENDOR,
    }).lean();
    if (!vendor) return { success: false, error: "Vendor not found" };

    // Admin can update full vendor details, so allow all possible vendor fields.
    const allowedFields = [
      "firstName",
      "lastName",
      "email",
      "mobNo",
      "dob",
      "gender",
      "cityNm",
      "pincode",
      "shopname",
      "shopaddress",
      "isActive",
      "status",
      "storeDetails", // if nested
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

    // Handle file uploads
    if (files?.profilePicture?.[0]) {
      update.profilePicture = FileService.generateFileObject(
        files.profilePicture[0]
      );
    }

    if (files?.storePictures?.[0]) {
      const sp = FileService.generateFileObject(files.storePictures[0]);
      update.storeDetails = update.storeDetails || {};
      update.storeDetails.storePictures = [sp];
    }

    // Safety check
    if (Object.keys(update).length === 0) {
      return { success: false, error: "No fields provided to update" };
    }

    const updatedVendor = await User.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true }
    ).lean();

    if (!updatedVendor) {
      return { success: false, error: "Vendor not found or update failed" };
    }
    const resp = { _id: updatedVendor._id };
    for (const k of Object.keys(update)) {
      if (k === "profilePicture") {
        resp.profilePicture = updatedVendor.profilePicture;
      } else if (k === "storePicture") {
        resp.storePicture = updatedVendor.storePicture;
      } else if (k === "storeDetails") {
        if (update.storeDetails.storeName)
          resp.shopname = updatedVendor.shopname;
        if (update.storeDetails.storeAddress)
          resp.shopaddress = updatedVendor.shopaddress;
        if (update.storeDetails.storePictures)
          resp.storeDetails = {
            storePictures: updatedVendor.storeDetails?.storePictures || [],
          };
      } else {
        resp[k] = updatedVendor[k];
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

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #2c3e50;">Welcome to ${
          process.env.APP_NAME || "Our Platform"
        } 🚀</h2>
        <h3>Hello ${deliveryPartner.firstName || "Delivery Partner"},</h3>
        <p>Your delivery partner account has been created successfully.</p>
        <p><strong>Mobile No:</strong> ${mobNo}</p>
        <p><strong>Date of Birth:</strong> ${dob}</p>
        <p style="margin-top: 20px; font-size: 14px; color: #666;">
          You can now log in using your registered mobile number.<br/>
          Thank you for joining us!<br/>
          — ${process.env.APP_NAME || "Team"}
        </p>
      </div>
    `;

    await sendEmail(email, "Your Delivery Partner Account Created", html);

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

    // Admin can update all these fields
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

    // Vehicle details mapping
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

    // Sync flat fields from vehicleDetails (for data consistency)
    if (update.vehicleDetails) {
      if (update.vehicleDetails.vehicleType)
        update.vehicleType = update.vehicleDetails.vehicleType;
      if (update.vehicleDetails.vehicleNo)
        update.vehicleNo = update.vehicleDetails.vehicleNo;
      if (update.vehicleDetails.driverLicenseNo)
        update.driverLicenseNo = update.vehicleDetails.driverLicenseNo;
    }

    // Nothing to update
    if (Object.keys(update).length === 0) {
      return { success: false, error: "No fields provided to update" };
    }

    // Perform the update
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

    // Prepare the response (only updated fields)
    const resp = { _id: updated._id };
    for (const key of Object.keys(update)) {
      if (key === "profilePicture") {
        resp.profilePicture = updated.profilePicture;
      } else if (key === "vehiclePictures" || key === "vehicleDetails") {
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
      const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #2c3e50;">Welcome to ${
            process.env.APP_NAME || "Our Platform"
          } 🎉</h2>
          <p>Hello ${firstName},</p>
          <p>Your customer account has been created by our team.</p>
          <p><strong>Mobile No:</strong> ${mobNo}</p>
          <p style="margin-top: 20px; font-size: 14px; color: #666;">
            You can log in anytime using your registered mobile number.
            <br/>
            — ${process.env.APP_NAME || "Team"}
          </p>
        </div>
      `;
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

    // Handle profile picture upload
    if (files?.profilePicture?.[0]) {
      update.profilePicture = FileService.generateFileObject(
        files.profilePicture[0]
      );
    }

    // If nothing to update
    if (Object.keys(update).length === 0) {
      return {
        success: false,
        error: "No fields provided to update",
      };
    }

    // Profile completion calculation
    let profileCompleted = 20;
    if (update.email || customer.email) profileCompleted += 20;
    if (update.dob || customer.dob) profileCompleted += 20;
    if (update.gender || customer.gender) profileCompleted += 20;
    profileCompleted += 20;
    update.profileCompleted = Math.min(profileCompleted, 100);

    // Perform the update
    const updated = await User.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true }
    ).lean();

    if (!updated)
      return { success: false, error: "Customer not found or update failed" };

    // Prepare minimal clean response
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
};
