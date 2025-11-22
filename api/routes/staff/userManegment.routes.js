const express = require("express");
const router = express.Router();
const {
  authMiddleware,
  permissionMiddleware,
} = require("../../middlewares/auth.middleware");
const { ROLE } = require("../../../config/constants/authConstant");
const { PERMISSIONS } = require("../../../config/constants/permissionConstant");
const validate = require("../../middlewares/validate");
const usersControllers = require("../../controllers/admin/userManagement.controller");
const vendorsValidate = require("../../helpers/utils/validations/auth/index");
const updateAllUsersValidate = require("../../helpers/utils/validations/updates/index");
const {
  uploadCustomerFiles,
  uploadVendorFiles,
  uploadDeliveryPartnerFiles,
} = require("../../middlewares/upload.middleware");

router.put(
  "/verify-status/:userId",
  authMiddleware([ROLE.SUPER_ADMIN, ROLE.ADMIN]),
  permissionMiddleware([PERMISSIONS.VERIFY_USER_STATUS]),
  usersControllers.verifyPendingStatus
);

// Vendor Routes
router.post(
  "/create-vendor",
  authMiddleware([ROLE.SUPER_ADMIN, ROLE.ADMIN]),
  permissionMiddleware([PERMISSIONS.CREATE_VENDOR]),
  validate(vendorsValidate.createVendorByAdmin),
  uploadVendorFiles,
  usersControllers.createVendorByAdminController
);

router.get(
  "/get-vendor-list",
  authMiddleware([ROLE.SUPER_ADMIN, ROLE.ADMIN]),
  permissionMiddleware([PERMISSIONS.VIEW_VENDORS]),
  usersControllers.getAllVendorsController
);

router.get(
  "/get-vendor/:id",
  authMiddleware([ROLE.SUPER_ADMIN, ROLE.ADMIN]),
  permissionMiddleware([PERMISSIONS.VIEW_VENDORS]),
  usersControllers.getVendorByIdController
);

router.put(
  "/update-vendor/:id",
  authMiddleware([ROLE.SUPER_ADMIN, ROLE.ADMIN]),
  permissionMiddleware([PERMISSIONS.UPDATE_VENDOR]),
  validate(updateAllUsersValidate.updateVendorsByAdmin),
  uploadVendorFiles,
  usersControllers.updateVendorByAdminController
);

router.delete(
  "/delete-vendor/:id",
  authMiddleware([ROLE.SUPER_ADMIN, ROLE.ADMIN]),
  permissionMiddleware([PERMISSIONS.DELETE_VENDOR]),
  usersControllers.deleteVendorByAdminController
);

// Delivery Partner Routes
router.post(
  "/create-delivery-partner",
  authMiddleware([ROLE.SUPER_ADMIN, ROLE.ADMIN]),
  permissionMiddleware([PERMISSIONS.CREATE_DELIVERY_PARTNER]),
  validate(vendorsValidate.createDeliveryPartnerByAdmin),
  uploadDeliveryPartnerFiles,
  usersControllers.createDeliveryPartnerByAdminController
);

router.get(
  "/get-delivery-partner-list",
  authMiddleware([ROLE.SUPER_ADMIN, ROLE.ADMIN]),
  permissionMiddleware([PERMISSIONS.VIEW_DELIVERY_PARTNERS]),
  usersControllers.getAllDeliveryPartnersController
);

router.get(
  "/get-delivery-partner/:id",
  authMiddleware([ROLE.SUPER_ADMIN, ROLE.ADMIN]),
  permissionMiddleware([PERMISSIONS.VIEW_DELIVERY_PARTNERS]),
  usersControllers.getDeliveryPartnerByIdController
);

router.put(
  "/update-delivery-partner/:id",
  authMiddleware([ROLE.SUPER_ADMIN, ROLE.ADMIN]),
  permissionMiddleware([PERMISSIONS.UPDATE_DELIVERY_PARTNER]),
  validate(updateAllUsersValidate.updateDeliveryPartnersByAdmin),
  uploadDeliveryPartnerFiles,
  usersControllers.updateDeliveryPartnerByAdminController
);

router.delete(
  "/delete-delivery-partner/:id",
  authMiddleware([ROLE.SUPER_ADMIN, ROLE.ADMIN]),
  permissionMiddleware([PERMISSIONS.DELETE_DELIVERY_PARTNER]),
  usersControllers.deleteDeliveryPartnerByAdminController
);

// Customer Routes
router.post(
  "/create-customer",
  authMiddleware([ROLE.SUPER_ADMIN, ROLE.ADMIN]),
  permissionMiddleware([PERMISSIONS.CREATE_CUSTOMER]),
  validate(vendorsValidate.createCustomerByAdmin),
  uploadCustomerFiles,
  usersControllers.createCustomerByAdminController
);

router.get(
  "/get-customer-list",
  authMiddleware([ROLE.SUPER_ADMIN, ROLE.ADMIN]),
  permissionMiddleware([PERMISSIONS.VIEW_CUSTOMERS]),
  usersControllers.getAllCustomersController
);

router.get(
  "/get-customer/:id",
  authMiddleware([ROLE.SUPER_ADMIN, ROLE.ADMIN]),
  permissionMiddleware([PERMISSIONS.VIEW_CUSTOMERS]),
  usersControllers.getCustomerByIdController
);

router.put(
  "/update-customer/:id",
  authMiddleware([ROLE.SUPER_ADMIN, ROLE.ADMIN]),
  permissionMiddleware([PERMISSIONS.UPDATE_CUSTOMER]),
  validate(updateAllUsersValidate.updateCustomerByAdmin),
  uploadCustomerFiles,
  usersControllers.updateCustomerByAdminController
);

router.delete(
  "/delete-customer/:id",
  authMiddleware([ROLE.SUPER_ADMIN, ROLE.ADMIN]),
  permissionMiddleware([PERMISSIONS.DELETE_CUSTOMER]),
  usersControllers.deleteCustomerByAdminController
);

module.exports = router;
