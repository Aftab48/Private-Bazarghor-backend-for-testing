const joi = require("joi");

const changePasswords = joi
  .object({
    oldPassword: joi.string().required(),
    newPassword: joi.string().required(),
  })
  .unknown(false);

module.exports = { changePasswords };
