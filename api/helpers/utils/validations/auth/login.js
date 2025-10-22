const joi = require("joi");

const loginAdmin = joi
  .object({
    email: joi.string().email({ tlds: { allow: false } }).required().error(new Error('Email must be a valid.')),
    password: joi.string().required(),
  })
  .unknown(false);

const loginUser = joi
  .object({
    email: joi.string().email({ tlds: { allow: false } }).required().error(new Error('Email must be a valid.')),
    password: joi.string().required(),
  })
  .unknown(false);

const adminUpdate = joi.object({
  firstName: joi.string().required(),
  lastName: joi.string().allow("", null),
})
  .unknown(false);

module.exports = {
  loginAdmin,
  loginUser,
  adminUpdate
};
