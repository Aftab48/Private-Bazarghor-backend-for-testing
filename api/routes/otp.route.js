const express = require("express");
const router = express.Router();
const otp = require("../services/otp.service");
const validate = require("../middlewares/validate");
const { loginUser } = require("../helpers/utils/validations/auth/index");
const { upload } = require("../middlewares/upload.middleware");

router.post(
  "/send-otp-registration",
  upload.none(),
  validate(loginUser),
  otp.sendOTP
);

router.post(
  "/verify-otp-registration",
  upload.none(),
  otp.verifyOTPForRegistration
);

router.post(
  "/verify-login",
  upload.none(),
  validate(loginUser),
  otp.verifyOTPAndLogin
);

router.post("/resend", upload.none(), validate(loginUser), otp.resendOTP);

module.exports = router;
