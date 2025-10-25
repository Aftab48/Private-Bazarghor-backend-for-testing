const joi = require("joi");

const resetPasswordCode = joi
  .object({
    email: joi
      .string()
      .email({ tlds: { allow: false } })
      .required()
      .error(new Error("Email must be a valid.")),
    newPassword: joi.string().required(),
    otp: joi.string().required(),
  })
  .unknown(false);

module.exports = {
  resetPasswordCode,
};
