const storeService = require("../../services/store.service");
const productService = require("../../services/product.service");
const message = require("../../helpers/utils/messages");
const { catchAsync } = require("../../helpers/utils/catchAsync");

const getOpenStores = catchAsync(async (req, res) => {
  const result = await storeService.getOpenStoresForCustomer(req);

  if (!result.success) {
    return message.failureResponse(
      result.error || "Failed to fetch open stores",
      res
    );
  }

  return message.successResponse(
    {
      status: true,
      message: "Open stores fetched successfully",
      data: result.data,
    },
    res
  );
});

const getStoreProducts = catchAsync(async (req, res) => {
  const result = await productService.getProductsForStore(req);
  if (!result.success) {
    return message.failureResponse(
      result.error || "Failed to fetch products",
      res
    );
  }
  return message.successResponse({ status: true, data: result.data }, res);
});

module.exports = {
  getOpenStores,
  getStoreProducts,
};
