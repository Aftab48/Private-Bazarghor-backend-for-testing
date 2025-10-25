const joi = require("joi");

const registerVendor = joi.object({
  // Basic Information
  firstName: joi
    .string()
    .required()
    .min(2)
    .max(50)
    .error(
      new Error("First name is required and must be between 2-50 characters")
    ),

  lastName: joi
    .string()
    .allow("", null)
    .max(50)
    .error(new Error("Last name must be maximum 50 characters")),

  email: joi
    .string()
    .email({ tlds: { allow: false } })
    .required()
    .error(new Error("Email must be a valid email address")),

  mobNo: joi
    .string()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      "string.empty": "Mobile number is required",
      "string.pattern.base": "Mobile number must be exactly 10 digits",
    }),

  password: joi
    .string()
    .min(6)
    .max(50)
    .error(new Error("Password must be between 6-50 characters")),

  // Personal Details
  gender: joi
    .string()
    .valid("male", "female", "other")
    .optional()
    .allow(null, "")
    .error(new Error("Gender must be one of: male, female, other")),

  dob: joi
    .date()
    .optional()
    .allow(null)
    .error(new Error("Date of birth must be a valid date")),

  cityNm: joi
    .string()
    .optional()
    .allow("", null)
    .max(100)
    .error(new Error("City name must be maximum 100 characters")),

  pincode: joi
    .string()
    .regex(/^[0-9]{6}$/)
    .required()
    .messages({
      "string.empty": "Pincode is required",
      "string.pattern.base": "Pincode must be exactly 6 digits",
    }),

  // Shop/Business Details
  shopname: joi
    .string()
    .required()
    .min(2)
    .max(100)
    .error(
      new Error("Shop name is required and must be between 2-100 characters")
    ),

  shopaddress: joi
    .string()
    .required()
    .min(1)
    .max(500)
    .error(
      new Error(
        "Shop address is required and must be between 10-500 characters"
      )
    ),

  consentAgree: joi
    .boolean()
    .valid(true)
    .error(new Error("You must give consent to proceed")),
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
      .error(new Error("Vehicle type is required and must be either cycle or bike.")),

    // 🔹 Driver & Vehicle Info (Conditional - Required only for bike)
    driverLicenseNo: joi
      .string()
      .when("vehicleType", {
        is: "bike",
        then: joi
          .string()
          .required()
          .min(5)
          .max(30)
          .messages({
            "string.empty": "Driver license number is required for bike.",
            "string.min": "Driver license number must be at least 5 characters.",
            "string.max": "Driver license number must be at most 30 characters.",
            "any.required": "Driver license number is required for bike.",
          }),
        otherwise: joi.string().allow("", null).optional(),
      }),

    vehicleNo: joi
      .string()
      .when("vehicleType", {
        is: "bike",
        then: joi
          .string()
          .required()
          .min(5)
          .max(20)
          .messages({
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

module.exports = {
  registerVendor,
  createDeliveryPartner,
};
