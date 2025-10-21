const express = require("express");
const router = express.Router();
const {
  sendOTP,
  verifyOTPForRegistration,
  verifyOTPAndLogin,
  resendOTP,
} = require("../services/otp.service");

router.post("/send-otp-registration", sendOTP);
router.post("/verify-otp-registration", verifyOTPForRegistration);
router.post("/verify-login", verifyOTPAndLogin);
router.post("/resend", resendOTP);

module.exports = router;
