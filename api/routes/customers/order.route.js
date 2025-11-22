const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../../middlewares/auth.middleware");
const { ROLE } = require("../../../config/constants/authConstant");
const orderController = require("../../controllers/customers/order.controller");

// Create order from cart (payment pending)
router.post(
  "/create",
  authMiddleware([ROLE.CUSTOMER]),
  orderController.createOrder
);

// Get all orders for user
router.get("/list", authMiddleware([ROLE.CUSTOMER]), orderController.getOrders);

// Get single order
router.get(
  "/get-order/:orderId",
  authMiddleware([ROLE.CUSTOMER]),
  orderController.getOrderById
);

// Get order history
router.get(
  "/get-order-history/:orderId/history",
  authMiddleware([ROLE.CUSTOMER]),
  orderController.getOrderHistory
);

// Add history entry (could be limited to staff/admin depending on business rules)
router.post(
  "/:orderId/history",
  authMiddleware([ROLE.CUSTOMER]),
  orderController.addHistory
);

// Update payment status (normally called by payment webhook/admin)
router.post(
  "/:orderId/payment",
  authMiddleware([ROLE.CUSTOMER]),
  orderController.updatePaymentStatus
);

module.exports = router;
