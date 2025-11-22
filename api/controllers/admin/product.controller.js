const { catchAsync } = require("../../helpers/utils/catchAsync");
const messages = require("../../helpers/utils/messages");
const productService = require("../../services/product.service");

const createProductByAdminController = catchAsync(async (req, res) => {
  const result = await productService.createProductByAdmin(req);
  if (result?.success) {
    return messages.successResponse(
      result.data,
      res,
      "Product created successfully (Admin)"
    );
  }
  return messages.failureResponse(
    result.error || "Product creation failed (Admin)",
    res
  );
});

const getProductsByAdminController = catchAsync(async (req, res) => {
  const result = await productService.getProductsByAdmin(req);
  if (result?.success) {
    return messages.successResponse(
      result.data,
      res,
      "Products fetched successfully"
    );
  }
  return messages.failureResponse(
    result.error || "Failed to fetch products",
    res
  );
});

const getProductByIdByAdminController = catchAsync(async (req, res) => {
  const result = await productService.getProductByIdByAdmin(req);

  if (result?.success) {
    return messages.successResponse(
      result.data,
      res,
      "Product fetched successfully"
    );
  }
  if (result?.notFound)
    return messages.failureResponse("Product not found", res, 404);

  return messages.failureResponse(
    result.error || "Failed to fetch product details",
    res
  );
});

const updateProductByAdminController = catchAsync(async (req, res) => {
  const result = await productService.updateProductByAdmin(req);

  if (result?.success) {
    return messages.successResponse(
      result.data,
      res,
      "Product updated successfully"
    );
  }
  if (result?.notFound)
    return messages.failureResponse("Product not found", res, 404);

  return messages.failureResponse(
    result.error || "Failed to update product",
    res
  );
});

const deleteProductByAdminController = catchAsync(async (req, res) => {
  const result = await productService.deleteProductByAdmin(req);

  if (result?.success) {
    return messages.successResponse(
      result.data,
      res,
      "Product deleted successfully"
    );
  }
  if (result?.notFound)
    return messages.failureResponse("Product not found", res, 404);

  return messages.failureResponse(
    result.error || "Failed to delete product",
    res
  );
});

module.exports = {
  createProductByAdminController,
  getProductsByAdminController,
  getProductByIdByAdminController,
  updateProductByAdminController,
  deleteProductByAdminController,
};
