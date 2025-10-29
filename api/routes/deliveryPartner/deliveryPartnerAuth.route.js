const express = require("express");
const router = express.Router();
const validate = require("../../middlewares/validate");
const { logoutUser } = require("../../services/auth");
const { ROLE } = require("../../../config/constants/authConstant");
const { authMiddleware } = require("../../middlewares/auth.middleware");
const otp = require("../../services/otp.service");
const validateDeliveryPartner = require("../../helpers/utils/validations/auth/index");
const updateDeliveryPartnerValidate = require("../../helpers/utils/validations/updates/index");
const deliveryPartnerController = require("../../controllers/deliveryPartner/deliveryPartner.controller");
const {
  uploadDeliveryPartnerFiles,
  upload,
} = require("../../middlewares/upload.middleware");

router.post(
  "/create-delivery-partner",
  validate(validateDeliveryPartner.createDeliveryPartner),
  uploadDeliveryPartnerFiles,
  deliveryPartnerController.registerDeliveryPartnerController
);

router.get(
  "/profile",
  authMiddleware([ROLE.DELIVERY_PARTNER]),
  deliveryPartnerController.getDeliveryPartnerController
);

router.put(
  "/update-profile",
  authMiddleware([ROLE.DELIVERY_PARTNER]),
  validate(updateDeliveryPartnerValidate.updateDeliveryPartners),
  uploadDeliveryPartnerFiles,
  deliveryPartnerController.updateDeliveryPartnerController
);

router.post(
  "/login/send-otp",
  upload.none(),
  validate(validate.loginUser),
  otp.sendOTP
);

router.post(
  "/login/verify",
  upload.none(),
  validate(validateDeliveryPartner.loginUser),
  otp.verifyOTPAndLogin
);

router.post(
  "/login/resend",
  upload.none(),
  validate(validateDeliveryPartner.loginUser),
  otp.resendOTP
);
router.post("/logout", authMiddleware([]), logoutUser);

module.exports = router;
