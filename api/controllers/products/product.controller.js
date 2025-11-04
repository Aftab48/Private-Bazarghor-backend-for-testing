const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getCategories,
} = require("../../services/product.service");
const { catchAsync } = require("../../helpers/utils/catchAsync");
const messages = require("../../helpers/utils/messages");

const createProductController = catchAsync(async (req, res) => {
  const result = await createProduct(req);
  if (result?.success) {
    return messages.successResponse(
      result.data,
      res,
      "Product created successfully"
    );
  } else {
    return messages.failureResponse(
      result.error || "Product creation failed",
      res
    );
  }
});

const getProductsController = catchAsync(async (req, res) => {
  const result = await getProducts(req);
  if (result?.success) {
    return messages.successResponse(
      result.data,
      res,
      "Products fetched successfully"
    );
  } else {
    return messages.failureResponse(
      result.error || "Failed to fetch products",
      res
    );
  }
});

const getProductByIdController = catchAsync(async (req, res) => {
  const result = await getProductById(req);
  if (result?.notFound) {
    return messages.notFound("Product not found", res);
  }
  if (result?.success) {
    return messages.successResponse(
      result.data,
      res,
      "Product fetched successfully"
    );
  } else {
    return messages.failureResponse(
      result.error || "Failed to fetch product",
      res
    );
  }
});

const updateProductController = catchAsync(async (req, res) => {
  const result = await updateProduct(req);
  if (result?.notFound) {
    return messages.notFound("Product not found", res);
  }
  if (result?.success) {
    return messages.successResponse(
      result.data,
      res,
      "Product updated successfully"
    );
  } else {
    return messages.failureResponse(
      result.error || "Product update failed",
      res
    );
  }
});

const deleteProductController = catchAsync(async (req, res) => {
  const result = await deleteProduct(req);
  if (result?.notFound) {
    return messages.notFound("Product not found", res);
  }
  if (result?.success) {
    return messages.successResponse(
      result.data,
      res,
      "Product deleted successfully"
    );
  } else {
    return messages.failureResponse(
      result.error || "Product deletion failed",
      res
    );
  }
});

const getCategoriesController = catchAsync(async (req, res) => {
  const result = await getCategories();
  if (result?.success) {
    return messages.successResponse(
      result.data,
      res,
      "Categories fetched successfully"
    );
  } else {
    return messages.failureResponse(
      result.error || "Failed to fetch categories",
      res
    );
  }
});

module.exports = {
  createProductController,
  getProductsController,
  getProductByIdController,
  updateProductController,
  deleteProductController,
  getCategoriesController,
};

