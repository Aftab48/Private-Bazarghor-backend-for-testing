const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../../middlewares/auth.middleware");
const { ROLE } = require("../../../config/constants/authConstant");
const validate = require("../../middlewares/validate");
const usersControllers = require("../../controllers/admin/userManegment.controller");
const vendorsValidate = require("../../helpers/utils/validations/auth/index");
const updateAllUsersValidate = require("../../helpers/utils/validations/updates/index");
const {
  uploadCustomerFiles,
  uploadVendorFiles,
  uploadDeliveryPartnerFiles,
} = require("../../middlewares/upload.middleware");

//Vendor Routes
router.post(
  "/create-vendor",
  authMiddleware([ROLE.SUPER_ADMIN, ROLE.ADMIN, ROLE.SUB_ADMIN]),
  validate(vendorsValidate.createVendorByAdmin),
  uploadVendorFiles,
  usersControllers.createVendorByAdminController
);

router.get(
  "/get-vendor-list",
  authMiddleware([ROLE.SUPER_ADMIN, ROLE.ADMIN, ROLE.SUB_ADMIN]),
  usersControllers.getAllVendorsController
);

router.get(
  "/get-vendor/:id",
  authMiddleware([ROLE.SUPER_ADMIN, ROLE.ADMIN, ROLE.SUB_ADMIN]),
  usersControllers.getVendorByIdController
);

router.put(
  "/update-vendor/:id",
  authMiddleware([ROLE.SUPER_ADMIN, ROLE.ADMIN, ROLE.SUB_ADMIN]),
  validate(updateAllUsersValidate.updateVendorsByAdmin),
  uploadVendorFiles,
  usersControllers.updateVendorByAdminController
);

router.delete(
  "/delete-vendor/:id",
  authMiddleware([ROLE.SUPER_ADMIN, ROLE.ADMIN, ROLE.SUB_ADMIN]),
  usersControllers.deleteVendorByAdminController
);

//Delivery Partner Routes
router.post(
  "/create-delivery-partner",
  authMiddleware([ROLE.SUPER_ADMIN, ROLE.ADMIN, ROLE.SUB_ADMIN]),
  validate(vendorsValidate.createDeliveryPartnerByAdmin),
  uploadDeliveryPartnerFiles,
  usersControllers.createDeliveryPartnerByAdminController
);

router.get(
  "/get-delivery-partner-list",
  authMiddleware([ROLE.SUPER_ADMIN, ROLE.ADMIN, ROLE.SUB_ADMIN]),
  usersControllers.getAllDeliveryPartnersController
);

router.get(
  "/get-delivery-partner/:id",
  authMiddleware([ROLE.SUPER_ADMIN, ROLE.ADMIN, ROLE.SUB_ADMIN]),
  usersControllers.getDeliveryPartnerByIdController
);

router.put(
  "/update-delivery-partner/:id",
  authMiddleware([ROLE.SUPER_ADMIN, ROLE.ADMIN, ROLE.SUB_ADMIN]),
  validate(updateAllUsersValidate.updateDeliveryPartnersByAdmin),
  uploadVendorFiles,
  usersControllers.updateDeliveryPartnerByAdminController
);

router.delete(
  "/delete-delivery-partner/:id",
  authMiddleware([ROLE.SUPER_ADMIN, ROLE.ADMIN, ROLE.SUB_ADMIN]),
  usersControllers.deleteDeliveryPartnerByAdminController
);

//Customers Routes
router.post(
  "/create-customer",
  authMiddleware([ROLE.SUPER_ADMIN, ROLE.ADMIN, ROLE.SUB_ADMIN]),
  validate(vendorsValidate.createCustomerByAdmin),
  uploadCustomerFiles,
  usersControllers.createCustomerByAdminController
);

router.get(
  "/get-customer-list",
  authMiddleware([ROLE.SUPER_ADMIN, ROLE.ADMIN, ROLE.SUB_ADMIN]),
  usersControllers.getAllCustomersController
);

router.get(
  "/get-customer/:id",
  authMiddleware([ROLE.SUPER_ADMIN, ROLE.ADMIN, ROLE.SUB_ADMIN]),
  usersControllers.getCustomerByIdController
);

router.put(
  "/update-customer/:id",
  authMiddleware([ROLE.SUPER_ADMIN, ROLE.ADMIN, ROLE.SUB_ADMIN]),
  validate(updateAllUsersValidate.updateCustomerByAdmin),
  uploadCustomerFiles,
  usersControllers.updateCustomerByAdminController
);

router.delete(
  "/delete-customer/:id",
  authMiddleware([ROLE.SUPER_ADMIN, ROLE.ADMIN, ROLE.SUB_ADMIN]),
  usersControllers.deleteCustomerByAdminController
);

module.exports = router;
