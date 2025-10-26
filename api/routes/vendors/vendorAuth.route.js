const express = require("express");
const router = express.Router();
const { ROLE } = require("../../../config/constants/authConstant");
const {
  createVendorController,
  VendorController,
  updateVendorController,
} = require("../../controllers/vendors/vendor.controller");
const { logoutUser } = require("../../services/auth");
const { authMiddleware } = require("../../middlewares/auth.middleware");
const {
  sendOTP,
  verifyOTPAndLogin,
  resendOTP,
} = require("../../services/otp.service");
const validate = require("../../middlewares/validate");
const {
  uploadVendorFiles,
  upload,
} = require("../../middlewares/upload.middleware");
const {
  registerVendor,
  loginUser,
} = require("../../helpers/utils/validations/auth/index");

router.post(
  "/create-vendor",
  validate(registerVendor),
  uploadVendorFiles,
  createVendorController
);

router.get("/profile", authMiddleware([ROLE.VENDOR]), VendorController);
router.put(
  "/update-profile",
  authMiddleware([ROLE.VENDOR]),
  uploadVendorFiles,
  updateVendorController
);

router.post("/logout", authMiddleware([]), logoutUser);
router.post("/login/send-otp", upload.none(), validate(loginUser), sendOTP);
router.post(
  "/login/verify",
  upload.none(),
  validate(loginUser),
  verifyOTPAndLogin
);
router.post("/login/resend", upload.none(), validate(loginUser), resendOTP);

module.exports = router;
