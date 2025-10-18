const express = require("express");
const router = express.Router();
const {
  createVendorController,
} = require("../../controllers/vendors/vendor.auth");
const validate = require("../../middlewares/validate");
const uploadVendorFiles = require("../../middlewares/upload.middleware");
const {
  registerVendor,
} = require("../../helpers/utils/validations/auth/index");

router.post(
  "/create-vendor",
  validate(registerVendor),
  uploadVendorFiles,
  createVendorController
);

module.exports = router;
