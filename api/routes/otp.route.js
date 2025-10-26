const express = require("express");
const router = express.Router();
const {
  sendOTP,
  verifyOTPForRegistration,
  verifyOTPAndLogin,
  resendOTP,
} = require("../services/otp.service");
const validate = require("../middlewares/validate");
const { loginUser } = require("../helpers/utils/validations/auth/index");
const { upload } = require("../middlewares/upload.middleware");

router.post(
  "/send-otp-registration",
  upload.none(),
  validate(loginUser),
  sendOTP
);
router.post(
  "/verify-otp-registration",
  upload.none(),
  verifyOTPForRegistration
);
router.post(
  "/verify-login",
  upload.none(),
  validate(loginUser),
  verifyOTPAndLogin
);
router.post("/resend", upload.none(), validate(loginUser), resendOTP);

module.exports = router;
