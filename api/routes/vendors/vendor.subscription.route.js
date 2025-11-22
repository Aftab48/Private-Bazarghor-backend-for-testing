const { PLAN_PERMISSIONS } = require("../../../config/constants/planConstant");
const express = require("express");
const router = express.Router();
const { ROLE } = require("../../../config/constants/authConstant");
const vendorSubscriptionController = require("../../controllers/vendors/vendorSubscription.controller");
const { authMiddleware } = require("../../middlewares/auth.middleware");

// Vendor subscription endpoints
router.post(
  "/purchase-subscription",
  authMiddleware([ROLE.VENDOR]),
  vendorSubscriptionController.createSubscriptionController
);

router.get(
  "/get-subscription",
  authMiddleware([ROLE.VENDOR]),
  // checkPermission(PLAN_PERMISSIONS.STANDARD),
  vendorSubscriptionController.getMySubscriptionsController
);

// router.get(
//   "/update-subscription/:id",
//   authMiddleware([ROLE.VENDOR]),
//   vendorSubscriptionController.getSubscriptionByIdController
// );

// router.delete(
//   "/delete-subscription/:id",
//   authMiddleware([ROLE.VENDOR]),
//   vendorSubscriptionController.cancelSubscriptionController
// );

router.put(
  "/renew-subscription/:id",
  authMiddleware([ROLE.VENDOR]),
  vendorSubscriptionController.renewSubscriptionByVendor
);

module.exports = router;
