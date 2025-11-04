const joi = require("joi");

const loginAdmin = joi
  .object({
    email: joi
      .string()
      .email({ tlds: { allow: false } })
      .required()
      .error(new Error("Email must be a valid.")),
    password: joi.string().required(),
  })
  .unknown(false);

const loginUser = joi
  .object({
    email: joi.string().trim().email().optional(),
    mobNo: joi
      .string()
      .pattern(/^[0-9]{10}$/)
      .message("Mobile number must be 10 digits"),
    otp: joi.string().trim(),
    deviceDetail: joi.string().trim().optional(),
  })
  .unknown(false);

const adminUpdate = joi
  .object({
    firstName: joi.string().trim().min(2).max(50),
    lastName: joi.string().trim().allow("", null).max(50),
    email: joi.string().trim().email().optional(),
    mobNo: joi
      .string()
      .pattern(/^[0-9]{10}$/)
      .message("Mobile number must be 10 digits"),
  })
  .unknown(false);

module.exports = {
  loginAdmin,
  loginUser,
  adminUpdate,
};
