const express = require("express");
const router = express.Router();
const validate = require("../../middlewares/validate");
const { logoutUser } = require("../../services/auth");
const { ROLE } = require("../../../config/constants/authConstant");
const { authMiddleware } = require("../../middlewares/auth.middleware");
const {
  sendOTP,
  verifyOTPAndLogin,
  resendOTP,
} = require("../../services/otp.service");
const {
  uploadDeliveryPartnerFiles,
  upload,
} = require("../../middlewares/upload.middleware");
const {
  createDeliveryPartner,
  loginUser,
} = require("../../helpers/utils/validations/auth/index");
const {
  registerDeliveryPartnerController,
  getDeliveryPartnerController,
  updateDeliveryPartnerController,
} = require("../../controllers/deliveryPartner/deliveryPartner.controller");

router.post(
  "/create-delivery-partner",
  validate(createDeliveryPartner),
  uploadDeliveryPartnerFiles,
  registerDeliveryPartnerController
);

// Delivery Partner logout
router.post("/logout", authMiddleware([]), logoutUser);
router.get(
  "/profile",
  authMiddleware([ROLE.DELIVERY_PARTNER]),
  getDeliveryPartnerController
);

// Update profile (partial) - accept files
router.put(
  "/update-profile",
  authMiddleware([ROLE.DELIVERY_PARTNER]),
  uploadDeliveryPartnerFiles,
  updateDeliveryPartnerController
);

// Delivery Partner OTP login (shared OTP service)
router.post("/login/send-otp", upload.none(), validate(loginUser), sendOTP);
router.post(
  "/login/verify",
  upload.none(),
  validate(loginUser),
  verifyOTPAndLogin
);
router.post("/login/resend", upload.none(), validate(loginUser), resendOTP);

module.exports = router;
