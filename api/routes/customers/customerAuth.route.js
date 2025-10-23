const express = require("express");
const router = express.Router();
const { uploadCustomerFiles } = require("../../middlewares/upload.middleware");
const { authMiddleware } = require("../../middlewares/auth.middleware");
const { ROLE } = require("../../../config/constants/authConstant");
const { logoutUser } = require("../../services/auth");
const {
  registerCustomer,
  loginCustomer,
  getCustomerProfile,
  updateCustomerProfile,
  addCustomerAddress,
  updateCustomerAddress,
  deleteCustomerAddress,
} = require("../../controllers/customers/customer.controller");

const { sendOTP, resendOTP } = require("../../services/otp.service");

router.post("/create-customer", uploadCustomerFiles, registerCustomer);
router.post("/login", loginCustomer);
router.get("/profile", authMiddleware([ROLE.CUSTOMER]), getCustomerProfile);
router.post("/logout", authMiddleware([]), logoutUser);

router.put(
  "/update-profile",
  authMiddleware([ROLE.CUSTOMER]),
  updateCustomerAddress,
  updateCustomerProfile
);

router.post("/address", authMiddleware([ROLE.CUSTOMER]), addCustomerAddress);
router.put(
  "/address/:addressId",
  authMiddleware([ROLE.CUSTOMER]),
  updateCustomerAddress
);
router.delete(
  "/address/:addressId",
  authMiddleware([ROLE.CUSTOMER]),
  deleteCustomerAddress
);

router.post("/login/send-otp", sendOTP);
router.post("/login/resend", resendOTP);

module.exports = router;
