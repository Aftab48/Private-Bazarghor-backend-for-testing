const {
  registerVendor,
  createDeliveryPartner,
  createAdminsValidation,
  updateAdminsValidation,
  createCustomer,
} = require("./register");
const { loginAdmin, loginUser, adminUpdate } = require("./login");
const { changePassword } = require("./changePassword");
const { resetPasswordCode } = require("./respassword");
const {
  createVendorByAdmin,
  createDeliveryPartnerByAdmin,
  createCustomerByAdmin,
} = require("./userManegment");

module.exports = {
  loginAdmin,
  loginUser,
  adminUpdate,
  registerVendor,
  createDeliveryPartner,
  changePassword,
  resetPasswordCode,
  createAdminsValidation,
  updateAdminsValidation,
  createVendorByAdmin,
  createDeliveryPartnerByAdmin,
  createCustomer,
  createCustomerByAdmin,
};
