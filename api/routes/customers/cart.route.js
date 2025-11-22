const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../../middlewares/auth.middleware");
const { ROLE } = require("../../../config/constants/authConstant");
const cartController = require("../../controllers/customers/cart.controller");

router.post(
  "/add-to-cart",
  authMiddleware([ROLE.CUSTOMER]),
  cartController.addToCart
);

router.get(
  "/get-cart",
  authMiddleware([ROLE.CUSTOMER]),
  cartController.getCart
);

router.put(
  "/update-item/:productId",
  authMiddleware([ROLE.CUSTOMER]),
  cartController.updateItemQuantity
);

router.delete(
  "/remove-item/:productId",
  authMiddleware([ROLE.CUSTOMER]),
  cartController.removeItem
);

module.exports = router;
