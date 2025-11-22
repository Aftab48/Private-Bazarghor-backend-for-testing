const store = require("../../services/store.service");
const { catchAsync } = require("../../helpers/utils/catchAsync");
const messages = require("../../helpers/utils/messages");

const toggleStoreStatusController = catchAsync(async (req, res) => {
  const result = await store.toggleVendorStoreOpenClose(req);

  if (result?.success) {
    return messages.successResponse(
      result.data,
      res,
      "Store status updated successfully"
    );
  } else if (result?.data) {
    return messages.recordNotFound(res, "Store not found");
  } else {
    return messages.failureResponse(
      result.error || "Store status update failed",
      res
    );
  }
});

const getAllStoresListByAdminController = catchAsync(async (req, res) => {
  const result = await store.getStoresByAdmin(req);

  if (result?.success) {
    return messages.successResponse(
      result.data,
      res,
      "Stores fetched successfully"
    );
  } else {
    return messages.failureResponse(
      result.error || "Failed to fetch stores",
      res
    );
  }
});

const getStoreByIdAdminControllers = catchAsync(async (req, res) => {
  const result = await store.getStoreByIdByAdmin(req);
  if (result?.success) {
    return messages.successResponse(
      result.data,
      res,
      "Store details fetched successfully"
    );
  } else if (result?.notFound) {
    return messages.notFound("Store not found", res);
  } else {
    return messages.failureResponse(
      result.error || "Failed to fetch store details",
      res
    );
  }
});

const updateStoreByAdminController = catchAsync(async (req, res) => {
  const result = await store.updateStoreByAdmin(req);

  if (result?.success) {
    return messages.successResponse(
      result.data,
      res,
      "Store updated successfully"
    );
  } else if (result?.notFound) {
    return messages.notFound("Store not found", res);
  } else {
    return messages.failureResponse(result.error || "Store update failed", res);
  }
});

module.exports = {
  toggleStoreStatusController,
  getAllStoresListByAdminController,
  getStoreByIdAdminControllers,
  updateStoreByAdminController,
};
