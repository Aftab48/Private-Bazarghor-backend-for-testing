const express = require("express");
const router = express.Router();
const uploadVendorFiles = require("../../middlewares/upload.middleware");
const validate = require("../../middlewares/validate");
const {
  createDeliveryPartner,
} = require("../../helpers/utils/validations/auth/index");
const {
  registerDeliveryPartnerController,
} = require("../../controllers/deliveryPartnar/delivaryPartner.contoller");

router.post(
  "/create-deliver-partner",
  validate(createDeliveryPartner),
  uploadVendorFiles,
  registerDeliveryPartnerController
);

module.exports = router;
