const joi = require("joi");

const addCustomerAddress = joi.object({
  addressLine1: joi.string().min(3).max(200).required().messages({
    "any.required": "Address Line 1 is required",
    "string.min": "Address Line 1 must be at least 3 characters",
    "string.max": "Address Line 1 must be less than 200 characters",
  }),

  addressLine2: joi.string().allow("", null).max(200),

  city: joi.string().min(2).max(100).messages({
    "any.required": "City is required",
  }),

  state: joi.string().min(2).max(100).required().messages({
    "any.required": "State is required",
  }),

  pincode: joi
    .string()
    .pattern(/^[0-9]{6}$/)
    .required()
    .messages({
      "any.required": "Pincode is required",
      "string.pattern.base": "Pincode must be exactly 6 digits",
    }),

  landmark: joi.string().allow("", null).max(200),

  addressType: joi
    .string()
    .valid("home", "office", "other")
    .default("home")
    .messages({
      "any.only": "Address type must be one of: home, office, other",
    }),

  isDefault: joi.boolean().default(false),
});

const updateCustomerAddress = joi.object({
  addressLine1: joi.string().min(3).max(200),
  addressLine2: joi.string().allow("", null).max(200),
  city: joi.string().min(2).max(100),
  state: joi.string().min(2).max(100),
  pincode: joi
    .string()
    .pattern(/^[0-9]{6}$/)
    .messages({
      "string.pattern.base": "Pincode must be exactly 6 digits",
    }),
  landmark: joi.string().allow("", null).max(200),
  addressType: joi.string().valid("home", "office", "other"),
  isDefault: joi.boolean(),
});

module.exports = { addCustomerAddress, updateCustomerAddress };
