const express = require("express");
const router = express.Router();
const { ROLE } = require("../../../config/constants/authConstant");
const productControllers = require("../../controllers/products/product.controller");
const adminProducts = require("../../controllers/admin/product.controller");
const { authMiddleware } = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validate");
const productValidations = require("../../helpers/utils/validations/products/index");
const {
  uploadProductImages,
  upload,
} = require("../../middlewares/upload.middleware");

router.post(
  "/add-product",
  authMiddleware([ROLE.VENDOR]),
  validate(productValidations.createProduct),
  uploadProductImages,
  productControllers.createProductController
);

router.get(
  "/categories/list",
  upload.none(),
  productControllers.getCategoriesController
);

router.get(
  "/get-products-list",
  authMiddleware([ROLE.VENDOR]),
  validate(productValidations.getProducts),
  productControllers.getProductsController
);

router.get(
  "/get-productsById/:id",
  authMiddleware([ROLE.VENDOR]),
  productControllers.getProductByIdController
);

router.put(
  "/update-productsById/:id",
  authMiddleware([ROLE.VENDOR]),
  validate(productValidations.updateProduct),
  uploadProductImages,
  productControllers.updateProductController
);

router.delete(
  "/delete-products/:id",
  authMiddleware([ROLE.VENDOR]),
  productControllers.deleteProductController
);

// ✅ Routes only for Super Admin & Admin
router.post(
  "/admin/add-product",
  authMiddleware([ROLE.SUPER_ADMIN, ROLE.ADMIN]),
  validate(productValidations.createProductByAdmin),
  uploadProductImages,
  adminProducts.createProductByAdminController
);

router.get(
  "/admin/get-products-list",
  authMiddleware([ROLE.SUPER_ADMIN, ROLE.ADMIN]),
  validate(productValidations.getProductsByAdmin),
  adminProducts.getProductsByAdminController
);

router.get(
  "/admin/get-product/:id",
  authMiddleware([ROLE.SUPER_ADMIN, ROLE.ADMIN]),
  validate(productValidations.getProductByIdByAdmin),
  adminProducts.getProductByIdByAdminController
);

router.put(
  "/admin/update-product/:id",
  authMiddleware([ROLE.SUPER_ADMIN, ROLE.ADMIN]),
  validate(productValidations.updateProductByAdmin),
  uploadProductImages,
  adminProducts.updateProductByAdminController
);

router.delete(
  "/admin/delete-product/:id",
  authMiddleware([ROLE.SUPER_ADMIN, ROLE.ADMIN]),
  adminProducts.deleteProductByAdminController
);

module.exports = router;
