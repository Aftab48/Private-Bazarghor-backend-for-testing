const express = require("express");
const router = express.Router();
const { ROLE } = require("../../../config/constants/authConstant");
const VendorControllers = require("../../controllers/vendors/vendor.controller");
const { logoutUser } = require("../../services/auth.service");
const { authMiddleware } = require("../../middlewares/auth.middleware");
const otp = require("../../services/otp.service");
const validate = require("../../middlewares/validate");
const validateVendors = require("../../helpers/utils/validations/auth/index");
const updateVendorsValidate = require("../../helpers/utils/validations/updates/index");
const {
  uploadVendorFiles,
  upload,
} = require("../../middlewares/upload.middleware");
const vendorSubscriptionController = require("../../controllers/vendors/vendorSubscription.controller");

router.post(
  "/create-vendor",
  validate(validateVendors.registerVendor),
  uploadVendorFiles,
  VendorControllers.createVendorController
);

router.get(
  "/profile",
  authMiddleware([ROLE.VENDOR]),
  VendorControllers.VendorController
);

router.put(
  "/update-profile",
  authMiddleware([ROLE.VENDOR]),
  validate(updateVendorsValidate.updateVendors),
  uploadVendorFiles,
  VendorControllers.updateVendorController
);

router.post(
  "/login/send-otp",
  upload.none(),
  validate(validateVendors.loginUser),
  otp.sendOTP
);

router.post(
  "/login/resend",
  upload.none(),
  validate(validateVendors.loginUser),
  otp.resendOTP
);

router.post(
  "/login/verify",
  upload.none(),
  validate(validateVendors.loginUser),
  otp.verifyOTPAndLogin
);

router.post("/logout", authMiddleware([]), logoutUser);
module.exports = router;
