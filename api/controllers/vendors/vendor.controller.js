const vendors = require("../../services/auth.service");
const { catchAsync } = require("../../helpers/utils/catchAsync");
const messages = require("../../helpers/utils/messages");

const createVendorController = catchAsync(async (req, res) => {
  const result = await vendors.createVendor(req, res);
  if (result?.success) {
    return messages.successResponse(
      result.data,
      res,
      "Vendor registered successfully"
    );
  } else {
    return messages.failureResponse(
      result.error || "Vendor registration failed",
      res
    );
  }
});

const VendorController = catchAsync(async (req, res) => {
  const userId = req.user;
  const result = await vendors.getVendor(userId);

  if (result?.notFound) {
    return messages.notFound("User not found", res);
  }
  return messages.successResponse(
    result.data,
    res,
    "Profile data fetched successfully"
  );
});

const updateVendorController = catchAsync(async (req, res) => {
  const userId = req.user;
  const result = await vendors.updateVendor(userId, req.body, req.files);

  if (result?.success) {
    return messages.successResponse(
      result.data,
      res,
      "Profile updated successfully"
    );
  } else if (result?.data) {
    return messages.recordNotFound(res, "User not found");
  } else {
    return messages.failureResponse(
      result.error || "Profile update failed",
      res
    );
  }
});

module.exports = {
  createVendorController,
  VendorController,
  updateVendorController,
};
