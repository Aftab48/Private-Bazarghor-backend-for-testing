const joi = require("joi");

const registerVendor = joi
  .object({
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
  })
  .unknown(false);

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

    // 🔹 Driver & Vehicle Info
    driverLicenseNo: joi
      .string()
      .required()
      .min(5)
      .max(30)
      .error(
        new Error(
          "Driver license number is required and must be between 5–30 characters."
        )
      ),

    vehicleNo: joi
      .string()
      .required()
      .min(5)
      .max(20)
      .error(
        new Error(
          "Vehicle number is required and must be between 5–20 characters."
        )
      ),

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
