const express = require("express");
const router = express.Router();
const { ROLE } = require("../../../config/constants/authConstant");
const vendorOrderController = require("../../controllers/vendors/order.controller");
const { authMiddleware } = require("../../middlewares/auth.middleware");

router.post(
  "/respond-to-order/:orderId",
  authMiddleware([ROLE.VENDOR]),
  vendorOrderController.respondToOrder
);

router.get(
  "/get-orders",
  authMiddleware([ROLE.VENDOR]),
  vendorOrderController.getVendorOrders
);

router.get(
  "/get-order/:orderId",
  authMiddleware([ROLE.VENDOR]),
  vendorOrderController.getVendorOrderById
);

module.exports = router;
