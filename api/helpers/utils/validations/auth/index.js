const { registerVendor, createDeliveryPartner } = require("./register");
const { loginAdmin, loginUser, adminUpdate } = require("./login");

module.exports = {
  loginAdmin,
  loginUser,
  adminUpdate,
  registerVendor,
  createDeliveryPartner,
};
