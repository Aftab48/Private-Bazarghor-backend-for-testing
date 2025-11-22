const express = require("express");
const router = express.Router();
const storeController = require("../../controllers/customers/store.controller");
const { authMiddleware } = require("../../middlewares/auth.middleware");
const { ROLE } = require("../../../config/constants/authConstant");

router.get(
  "/open-stores",
  authMiddleware([ROLE.CUSTOMER]),
  storeController.getOpenStores
);

// Get products for a store (customer)
router.get(
  "/products/:storeId",
  authMiddleware([ROLE.CUSTOMER]),
  storeController.getStoreProducts
);

module.exports = router;
