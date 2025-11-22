const express = require("express");
const router = express.Router();
const adminControllers = require("../../controllers/admin/admin.controller");
const { logoutUser } = require("../../services/auth.service");
const {
  authMiddleware,
  attachPermissions,
  permissionMiddleware,
} = require("../../middlewares/auth.middleware");
const { ROLE } = require("../../../config/constants/authConstant");
const { PERMISSIONS } = require("../../../config/constants/permissionConstant");
const validate = require("../../middlewares/validate");
const adminValidate = require("../../helpers/utils/validations/auth/index");
const addStaff = require("../../controllers/staff/staffManagement.controller");
const {
  changePasswords,
} = require("../../helpers/utils/validations/auth/changePassword");
const {
  uploadAdminProfile,
  upload,
} = require("../../middlewares/upload.middleware");
const adminOrderController = require("../../controllers/admin/order.controller");
const vendorSubController = require("../../controllers/admin/vendorSubscription.controller");

router.use(express.json());

router.post(
  "/login",
  upload.none(),
  validate(adminValidate.loginAdmin),
  adminControllers.adminLogin
);

router.post(
  "/change-password/:id",
  authMiddleware([ROLE.SUPER_ADMIN]),
  permissionMiddleware([PERMISSIONS.UPDATE_ADMIN]),
  validate(changePasswords),
  upload.none(),
  adminControllers.changeAdminPassword
);

router.get(
  "/profile",
  authMiddleware([ROLE.SUPER_ADMIN]),
  permissionMiddleware([PERMISSIONS.VIEW_ADMINS]),
  adminControllers.getAdminsController
);

router.put(
  "/update",
  authMiddleware([ROLE.SUPER_ADMIN]),
  permissionMiddleware([PERMISSIONS.UPDATE_ADMIN]),
  validate(adminValidate.adminUpdate),
  uploadAdminProfile,
  addStaff.updateSelfAdminController
);

router.post(
  "/reset-password",
  validate(adminValidate.resetPasswordCode),
  adminControllers.resetPasswordController
);

router.post("/forget-password", adminControllers.forgotPasswordController);
router.post("/logout", authMiddleware([]), logoutUser);

// Admin order routes
router.get(
  "/orders/vendor/:vendorId",
  authMiddleware([ROLE.SUPER_ADMIN]),
  permissionMiddleware([PERMISSIONS.VIEW_ORDERS]),
  adminOrderController.getOrdersByVendor
);

router.get(
  "/order/:orderId/history",
  authMiddleware([ROLE.SUPER_ADMIN]),
  permissionMiddleware([PERMISSIONS.VIEW_ORDERS]),
  adminOrderController.getOrderHistoryAdmin
);

// Vendor subscription management
router.post(
  "/vendor-subscription",
  authMiddleware([ROLE.SUPER_ADMIN]),
  permissionMiddleware([PERMISSIONS.MANAGE_SUBSCRIPTIONS]),
  vendorSubController.createSubscription
);

router.get(
  "/vendor-subscription",
  authMiddleware([ROLE.SUPER_ADMIN]),
  permissionMiddleware([PERMISSIONS.MANAGE_SUBSCRIPTIONS]),
  vendorSubController.listSubscriptions
);

router.get(
  "/vendor-subscription/:id",
  authMiddleware([ROLE.SUPER_ADMIN]),
  permissionMiddleware([PERMISSIONS.MANAGE_SUBSCRIPTIONS]),
  vendorSubController.getSubscriptionById
);

router.put(
  "/vendor-subscription/:subscriptionId/assign",
  authMiddleware([ROLE.SUPER_ADMIN]),
  permissionMiddleware([PERMISSIONS.MANAGE_SUBSCRIPTIONS]),
  vendorSubController.assignSubscriptionToStore
);

router.put(
  "/vendor-subscription/:id/renew",
  authMiddleware([ROLE.SUPER_ADMIN]),
  permissionMiddleware([PERMISSIONS.MANAGE_SUBSCRIPTIONS]),
  vendorSubController.renewSubscription
);

router.delete(
  "/cancel-vendor-subscription/:id",
  authMiddleware([ROLE.SUPER_ADMIN]),
  permissionMiddleware([PERMISSIONS.MANAGE_SUBSCRIPTIONS]),
  vendorSubController.cancelSubscription
);

router.get(
  "/permissions",
  authMiddleware([ROLE.SUPER_ADMIN, ROLE.ADMIN, ROLE.SUB_ADMIN]),
  attachPermissions,
  (req, res) => {
    return res.status(200).json({
      success: true,
      data: {
        userId: req.user,
        permissions: req.userPermissions || [],
      },
    });
  }
);

module.exports = router;
