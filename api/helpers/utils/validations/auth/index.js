const { registerVendor, createDeliveryPartner } = require("./register");
const { loginAdmin, loginUser, adminUpdate } = require("./login");
const { changePassword } = require("./changePassword");
const { resetPasswordCode} = require("./respassword")
 

module.exports = {
  loginAdmin,
  loginUser,
  adminUpdate,
  registerVendor,
  createDeliveryPartner,
  changePassword,
  resetPasswordCode
};
