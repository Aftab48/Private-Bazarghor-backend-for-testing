const express = require("express");
const router = express.Router();
const { ROLE } = require("../../../config/constants/authConstant");
const productControllers = require("../../controllers/products/product.controller");
const { authMiddleware } = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validate");
const productValidations = require("../../helpers/utils/validations/products/index");
const {
  uploadProductImages,
  upload,
} = require("../../middlewares/upload.middleware");

// Create Product (Vendor only)
router.post(
  "/create",
  authMiddleware([ROLE.VENDOR]),
  validate(productValidations.createProduct),
  uploadProductImages,
  productControllers.createProductController
);

// Get Categories and Subcategories (Public endpoint - must be before /:id)
router.get(
  "/categories/list",
  upload.none(),
  productControllers.getCategoriesController
);

// Get Products (with filters and pagination)
router.get(
  "/",
  authMiddleware([ROLE.VENDOR, ROLE.ADMIN, ROLE.SUPER_ADMIN, ROLE.CUSTOMER]),
  validate(productValidations.getProducts),
  productControllers.getProductsController
);

// Get Product By ID
router.get(
  "/:id",
  authMiddleware([ROLE.VENDOR, ROLE.ADMIN, ROLE.SUPER_ADMIN, ROLE.CUSTOMER]),
  productControllers.getProductByIdController
);

// Update Product (Vendor only)
router.put(
  "/:id",
  authMiddleware([ROLE.VENDOR]),
  validate(productValidations.updateProduct),
  uploadProductImages,
  productControllers.updateProductController
);

// Delete Product (Vendor only - Soft Delete)
router.delete(
  "/:id",
  authMiddleware([ROLE.VENDOR]),
  productControllers.deleteProductController
);

module.exports = router;

