const joi = require("joi");
const { ROLE } = require("../../../../../config/constants/authConstant");

const createVendorByAdmin = joi.object({
  firstName: joi
    .string()
    .min(2)
    .max(50)
    .required()
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

  cityNm: joi
    .string()
    .optional()
    .allow("", null)
    .max(100)
    .error(new Error("City name must be maximum 100 characters")),

  pinCode: joi
    .string()
    .regex(/^[0-9]{6}$/)
    .messages({
      "string.empty": "Pincode is required",
      "string.pattern.base": "Pincode must be exactly 6 digits",
    }),

  // Shop/Business Details
  storeName: joi
    .string()
    .min(2)
    .max(100)
    .error(
      new Error("Shop name is required and must be between 2-100 characters")
    ),

  storeAddress: joi
    .string()
    .min(1)
    .max(500)
    .error(
      new Error(
        "Shop address is required and must be between 10-500 characters"
      )
    ),
  //   vehicleNo: joi.string().min(10).max(10).error(),
  roleType: joi.string().valid(ROLE.VENDOR).required().messages({
    "any.only": "Role type must be one of: VENDOR",
    "any.required": "Role type is required",
  }),
});

const createDeliveryPartnerByAdmin = joi
  .object({
    // 🔹 Basic Information
    firstName: joi
      .string()
      .min(2)
      .max(50)
      .required()
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

    dob: joi
      .date()
      .iso()
      .optional()
      .allow(null, "")
      .error(new Error("Date of birth must be a valid ISO date.")),

    gender: joi
      .string()
      .valid("male", "female", "other")
      .error(new Error("Gender must be one of: male, female, or other.")),

    vehicleType: joi
      .string()
      .valid("cycle", "bike")
      .error(
        new Error("Vehicle type is required and must be either cycle or bike.")
      ),

    driverLicenseNo: joi.string().when("vehicleType", {
      is: "bike",
      then: joi.string().min(5).max(30).messages({
        "string.empty": "Driver license number is required for bike.",
        "string.min": "Driver license number must be at least 5 characters.",
        "string.max": "Driver license number must be at most 30 characters.",
        "any.required": "Driver license number is required for bike.",
      }),
      otherwise: joi.string().allow("", null).optional(),
    }),

    vehicleNo: joi.string().when("vehicleType", {
      is: "bike",
      then: joi.string().min(5).max(20).messages({
        "string.empty": "Vehicle number is required for bike.",
        "string.min": "Vehicle number must be at least 5 characters.",
        "string.max": "Vehicle number must be at most 20 characters.",
        "any.required": "Vehicle number is required for bike.",
      }),
      otherwise: joi.string().allow("", null).optional(),
    }),

    roleType: joi.string().valid(ROLE.DELIVERY_PARTNER).required().messages({
      "any.only": "Role type must be one of: DELIVERY_PARTNER",
      "any.required": "Role type is required",
    }),
  })
  .unknown(false);

const createCustomerByAdmin = joi
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
    roleType: joi.string().valid(ROLE.CUSTOMER).required().messages({
      "any.only": "Role type must be one of: CUSTOMER",
      "any.required": "Role type is required",
    }),
  })

  .unknown(false);

module.exports = {
  createVendorByAdmin,
  createDeliveryPartnerByAdmin,
  createCustomerByAdmin,
};
