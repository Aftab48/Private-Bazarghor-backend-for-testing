const joi = require("joi");

const updateCustomer = joi.object({
  firstName: joi.string().min(2).max(50).messages({
    "string.min": "First name must be at least 2 characters",
    "string.max": "First name must be less than 50 characters",
  }),

  lastName: joi.string().allow("", null).max(50).messages({
    "string.max": "Last name must be less than 50 characters",
  }),

  email: joi
    .string()
    .email({ tlds: { allow: false } })
    .messages({
      "string.email": "Email must be a valid email address",
    }),

  dob: joi.date().allow(null).messages({
    "date.base": "Date of birth must be a valid date",
  }),

  gender: joi
    .string()
    .valid("male", "female", "other")
    .allow("", null)
    .messages({
      "any.only": "Gender must be one of: male, female, other",
    }),
});
const updateVendors = joi.object({
  firstName: joi.string().min(2).max(50),
  lastName: joi.string().min(2).max(50),
  email: joi.string().email().messages({
    "string.email": "Email must be valid",
  }),
  mobNo: joi
    .string()
    .pattern(/^[0-9]{10}$/)
    .messages({
      "string.pattern.base": "Mobile number must be 10 digits",
    }),
  dob: joi.date().optional(),
  gender: joi.string().valid("Male", "Female", "Other").optional(),
  cityNm: joi.string().allow("").max(100),
  pinCode: joi.string().allow("").max(10),

  storeName: joi.string().min(3).max(100),
  storeAddress: joi.string().min(5).max(300),
  openingTime: joi
    .string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .messages({
      "string.pattern.base":
        "Opening time must be in HH:mm format (e.g. 09:00)",
    }),
  closingTime: joi
    .string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .messages({
      "string.pattern.base":
        "Closing time must be in HH:mm format (e.g. 21:30)",
    }),
  workingDays: joi
    .array()
    .items(
      joi
        .string()
        .valid(
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday"
        )
    ),
  description: joi.string().allow("").max(500),
});

const updateDeliveryPartners = joi
  .object({
    // 🔹 Basic Information
    firstName: joi
      .string()

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

      .error(new Error("Email must be a valid email address.")),

    partnerAddress: joi
      .string()
      .min(1)
      .max(500)
      .error(
        new Error(
          "Partner address is required and must be between 10-500 characters"
        )
      ),
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

    // mobNo: joi
    //   .string()
    //   .pattern(/^[0-9]{10}$/)

    //   .messages({
    //     "string.empty": "Mobile number is required.",
    //     "string.pattern.base": "Mobile number must be exactly 10 digits.",
    //   }),

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

      .error(new Error("Gender must be one of: male, female, or other.")),

    // // 🔹 Vehicle Type (Required)
    // vehicleType: joi
    //   .string()
    //   .valid("cycle", "bike")

    //   .error(
    //     new Error("Vehicle type is required and must be either cycle or bike.")
    //   ),

    // // 🔹 Driver & Vehicle Info (Conditional - Required only for bike)
    // driverLicenseNo: joi.string().when("vehicleType", {
    //   is: "bike",
    //   then: joi.strin.min(5).max(30).messages({
    //     "string.empty": "Driver license number is required for bike.",
    //     "string.min": "Driver license number must be at least 5 characters.",
    //     "string.max": "Driver license number must be at most 30 characters.",
    //     "any.required": "Driver license number is required for bike.",
    //   }),
    //   otherwise: joi.string().allow("", null).optional(),
    // }),

    // vehicleNo: joi.string().when("vehicleType", {
    //   is: "bike",
    //   then: joi.strin.min(5).max(20).messages({
    //     "string.empty": "Vehicle number is required for bike.",
    //     "string.min": "Vehicle number must be at least 5 characters.",
    //     "string.max": "Vehicle number must be at most 20 characters.",
    //     "any.required": "Vehicle number is required for bike.",
    //   }),
    //   otherwise: joi.string().allow("", null).optional(),
    // }),
  })
  .unknown(false);

const updateCustomerByAdmin = joi.object({
  firstName: joi.string().min(2).max(50).messages({
    "string.min": "First name must be at least 2 characters",
    "string.max": "First name must be less than 50 characters",
  }),

  lastName: joi.string().allow("", null).max(50).messages({
    "string.max": "Last name must be less than 50 characters",
  }),

  email: joi
    .string()
    .email({ tlds: { allow: false } })
    .messages({
      "string.email": "Email must be a valid email address",
    }),

  dob: joi.date().allow(null).messages({
    "date.base": "Date of birth must be a valid date",
  }),

  gender: joi
    .string()
    .valid("male", "female", "other")
    .allow("", null)
    .messages({
      "any.only": "Gender must be one of: male, female, other",
    }),
});

const updateVendorsByAdmin = joi.object({
  firstName: joi.string().min(2).max(50),
  lastName: joi.string().min(2).max(50),
  email: joi.string().email(),
  mobNo: joi
    .string()
    .pattern(/^[0-9]{10}$/)
    .messages({
      "string.pattern.base": "Mobile number must be 10 digits",
    }),
  dob: joi.date().optional(),
  gender: joi.string().valid("Male", "Female", "Other"),
  cityNm: joi.string().allow("").max(100),
  pinCode: joi.string().allow("").max(10),
  isActive: joi.boolean(),
  status: joi.number().valid(0, 1, 2),
  // store fields
  storeName: joi.string().min(3).max(100),
  storeAddress: joi.string().min(5).max(300),
  category: joi.string().allow("").max(100),
  contactNumber: joi
    .string()
    .pattern(/^[0-9]{10}$/)
    .messages({
      "string.pattern.base": "Contact number must be 10 digits",
    }),
  openingTime: joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  closingTime: joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  workingDays: joi
    .array()
    .items(
      joi
        .string()
        .valid(
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday"
        )
    ),
  description: joi.string().allow("").max(500),
});

const updateDeliveryPartnersByAdmin = joi
  .object({
    // 🔹 Basic Information
    firstName: joi
      .string()

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

      .error(new Error("Email must be a valid email address.")),

    mobNo: joi
      .string()
      .pattern(/^[0-9]{10}$/)

      .messages({
        "string.empty": "Mobile number is required.",
        "string.pattern.base": "Mobile number must be exactly 10 digits.",
      }),

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

      .error(new Error("Gender must be one of: male, female, or other.")),

    partnerAddress: joi
      .string()
      .min(1)
      .max(500)
      .error(
        new Error(
          "Partner address is required and must be between 10-500 characters"
        )
      ),
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
    // // 🔹 Vehicle Type (Required)
    vehicleType: joi
      .string()
      .valid("cycle", "bike")

      .error(
        new Error("Vehicle type is required and must be either cycle or bike.")
      ),

    // 🔹 Driver & Vehicle Info (Conditional - Required only for bike)
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
  })
  .unknown(false);

module.exports = {
  updateCustomer,
  updateDeliveryPartners,
  updateVendors,
  updateCustomerByAdmin,
  updateDeliveryPartnersByAdmin,
  updateVendorsByAdmin,
};
