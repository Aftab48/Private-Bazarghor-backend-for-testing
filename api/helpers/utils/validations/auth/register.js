const joi = require("joi");
const {
  VENDOR_STATUS,
} = require("../../../../../config/constants/authConstant");

const registerVendor = joi.object({
  // Basic Info
  firstName: joi.string().min(2).max(50).required().messages({
    "string.empty": "First name is required",
    "string.min": "First name must be at least 2 characters",
    "string.max": "First name cannot exceed 50 characters",
  }),

  lastName: joi.string().allow("", null).max(50).messages({
    "string.max": "Last name cannot exceed 50 characters",
  }),

  email: joi
    .string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      "string.email": "Email must be a valid email address",
      "string.empty": "Email is required",
    }),

  mobNo: joi
    .string()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      "string.empty": "Mobile number is required",
      "string.pattern.base": "Mobile number must be exactly 10 digits",
    }),

  password: joi.string().min(6).max(50).messages({
    "string.empty": "Password is required",
    "string.min": "Password must be at least 6 characters",
    "string.max": "Password cannot exceed 50 characters",
  }),

  gender: joi
    .string()
    .valid("male", "female", "other")
    .allow("", null)
    .messages({
      "any.only": "Gender must be one of: male, female, or other",
    }),

  dob: joi.date().allow(null).messages({
    "date.base": "Date of birth must be a valid date",
  }),

  cityNm: joi.string().allow("", null).max(100).messages({
    "string.max": "City name cannot exceed 100 characters",
  }),

  pinCode: joi
    .string()
    .regex(/^[0-9]{6}$/)
    .required()
    .messages({
      "string.empty": "Pincode is required",
      "string.pattern.base": "Pincode must be exactly 6 digits",
    }),

  // 🏪 Store Info
  storeDetails: joi.object({
    storeName: joi.string().min(2).max(100).required().messages({
      "string.empty": "Store name is required",
      "string.min": "Store name must be at least 2 characters",
      "string.max": "Store name cannot exceed 100 characters",
    }),
    storeAddress: joi.string().min(5).max(255).required().messages({
      "string.empty": "Store address is required",
      "string.min": "Store address must be at least 5 characters",
      "string.max": "Store address cannot exceed 255 characters",
    }),
    contactNumber: joi
      .string()
      .pattern(/^[0-9]{10}$/)
      .messages({
        "string.pattern.base": "Contact number must be exactly 10 digits",
      }),
    email: joi
      .string()
      .email({ tlds: { allow: false } })
      .messages({
        "string.email": "Store email must be a valid email address",
      }),
    storePictures: joi
      .array()
      .items(
        joi.object({
          fileName: joi.string().allow(null, ""),
          filePath: joi.string().allow(null, ""),
          fileType: joi.string().allow(null, ""),
        })
      )
      .default([]),
    storeStatus: joi.number().default(VENDOR_STATUS.PENDING),
  }),
});

const createDeliveryPartner = joi
  .object({
    // 🔹 Basic Information
    firstName: joi
      .string()
      .required()
      .min(2)
      .max(50)
      .error(
        new Error("First name is required and must be between 2–50 characters.")
      ),

    lastName: joi
      .string()
      .allow("", null)
      .max(50)
      .error(new Error("Last name must be at most 50 characters.")),

    email: joi
      .string()
      .email({ tlds: { allow: false } })
      .required()
      .error(new Error("Email must be a valid email address.")),

    mobNo: joi
      .string()
      .pattern(/^[0-9]{10}$/)
      .required()
      .messages({
        "string.empty": "Mobile number is required.",
        "string.pattern.base": "Mobile number must be exactly 10 digits.",
      }),

    password: joi
      .string()
      .min(6)
      .max(50)
      .error(new Error("Password must be between 6–50 characters.")),

    // 🔹 Personal Details
    dob: joi
      .date()
      .iso()
      .optional()
      .allow(null, "")
      .error(new Error("Date of birth must be a valid ISO date.")),

    gender: joi
      .string()
      .valid("male", "female", "other")
      .required()
      .error(new Error("Gender must be one of: male, female, or other.")),

    // 🔹 Vehicle Type (Required)
    vehicleType: joi
      .string()
      .valid("cycle", "bike")
      .required()
      .error(
        new Error("Vehicle type is required and must be either cycle or bike.")
      ),

    // 🔹 Driver & Vehicle Info (Conditional - Required only for bike)
    driverLicenseNo: joi.string().when("vehicleType", {
      is: "bike",
      then: joi.string().required().min(5).max(30).messages({
        "string.empty": "Driver license number is required for bike.",
        "string.min": "Driver license number must be at least 5 characters.",
        "string.max": "Driver license number must be at most 30 characters.",
        "any.required": "Driver license number is required for bike.",
      }),
      otherwise: joi.string().allow("", null).optional(),
    }),

    vehicleNo: joi.string().when("vehicleType", {
      is: "bike",
      then: joi.string().required().min(5).max(20).messages({
        "string.empty": "Vehicle number is required for bike.",
        "string.min": "Vehicle number must be at least 5 characters.",
        "string.max": "Vehicle number must be at most 20 characters.",
        "any.required": "Vehicle number is required for bike.",
      }),
      otherwise: joi.string().allow("", null).optional(),
    }),

    // 🔹 Consent
    consentAgree: joi
      .boolean()
      .valid(true)
      .error(new Error("You must give consent to proceed.")),
  })
  .unknown(false);

const createCustomer = joi
  .object({
    firstName: joi
      .string()
      .required()
      .min(2)
      .max(50)
      .error(
        new Error("First name is required and must be between 2–50 characters.")
      ),

    lastName: joi
      .string()
      .allow("", null)
      .max(50)
      .error(new Error("Last name must be at most 50 characters.")),
    mobNo: joi
      .string()
      .pattern(/^[0-9]{10}$/)
      .required()
      .messages({
        "string.empty": "Mobile number is required.",
        "string.pattern.base": "Mobile number must be exactly 10 digits.",
      }),
  })
  .unknown(false);

const createAdminsValidation = joi
  .object({
    firstName: joi.string().trim().min(2).max(50).required(),
    lastName: joi.string().trim().allow("", null).max(50),
    email: joi.string().trim().email().required().messages({
      "string.email": "Invalid email format",
      "any.required": "Email is required",
    }),
    mobNo: joi
      .string()
      .trim()
      .pattern(/^[0-9]{10}$/)
      .required()
      .messages({
        "string.pattern.base": "Mobile number must be 10 digits",
        "any.required": "Mobile number is required",
      }),
    roleType: joi.string().trim().required().messages({
      "any.required": "Role type is required",
    }),
  })
  .unknown(false);

const updateAdminsValidation = joi
  .object({
    firstName: joi.string().trim().min(2).max(50),
    lastName: joi.string().trim().allow("", null).max(50),
    email: joi.string().trim().email().optional(),
    mobNo: joi
      .string()
      .trim()
      .pattern(/^[0-9]{10}$/)
      .message("Mobile number must be 10 digits")
      .optional(),
    isActive: joi.boolean().optional(),
  })
  .min(1)
  .unknown(false);

module.exports = {
  registerVendor,
  createDeliveryPartner,
  createCustomer,
  createAdminsValidation,
  updateAdminsValidation,
};
