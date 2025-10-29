const express = require("express");
const router = express.Router();
const validate = require("../../middlewares/validate");
const { ROLE } = require("../../../config/constants/authConstant");
const { authMiddleware } = require("../../middlewares/auth.middleware");
const { logoutUser } = require("../../services/auth");
const otp = require("../../services/otp.service");
const customerValidate = require("../../helpers/utils/validations/auth/index");
const customerAddress = require("../../helpers/utils/validations/customerAddresess/index");
const customerUpdate = require("../../helpers/utils/validations/updates/index");
const customerControllers = require("../../controllers/customers/customer.controller");
const {
  uploadCustomerFiles,
  upload,
} = require("../../middlewares/upload.middleware");

router.post(
  "/create-customer",
  upload.none(),
  validate(customerValidate.createCustomer),
  customerControllers.registerCustomer
);

router.post(
  "/login",
  upload.none(),
  validate(customerValidate.loginUser),
  customerControllers.loginCustomer
);

router.get(
  "/profile",
  authMiddleware([ROLE.CUSTOMER]),
  customerControllers.getCustomerProfile
);

router.put(
  "/update-profile",
  authMiddleware([ROLE.CUSTOMER]),
  validate(customerUpdate.updateCustomer),
  uploadCustomerFiles,
  customerControllers.updateCustomerProfile
);

router.post(
  "/address",
  authMiddleware([ROLE.CUSTOMER]),
  validate(customerAddress.addCustomerAddress),
  customerControllers.addAddressController
);

router.put(
  "/address/:addressId",
  authMiddleware([ROLE.CUSTOMER]),
  validate(customerAddress.updateCustomerAddress),
  customerControllers.updateAddressController
);

router.delete(
  "/address/:addressId",
  authMiddleware([ROLE.CUSTOMER]),
  customerControllers.deleteAddressController
);

router.post(
  "/login/send-otp",
  upload.none(),
  validate(customerValidate.loginUser),
  otp.sendOTP
);

router.post(
  "/login/resend",
  upload.none(),
  validate(customerValidate.loginUser),
  otp.resendOTP
);
router.post("/logout", authMiddleware([]), logoutUser);

module.exports = router;
