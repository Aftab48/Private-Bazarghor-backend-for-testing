const messages = require("../../helpers/utils/messages");
const { catchAsync } = require("../../helpers/utils/catchAsync");
const deliverPartner = require("../../services/auth.service");

const registerDeliveryPartnerController = catchAsync(async (req, res) => {
  const result = await deliverPartner.createDeliveryPartner(req, res);

  if (result?.success) {
    return messages.successResponse(
      result.data,
      res,
      "Delivery Partner registered successfully"
    );
  } else {
    return messages.failureResponse(result.error || "Registration failed", res);
  }
});

const getDeliveryPartnerController = catchAsync(async (req, res) => {
  const userId = req.user;
  const result = await deliverPartner.getDeliveryPartner(userId);

  if (result?.notFound) {
    return messages.notFound("User not found", res);
  }
  return messages.successResponse(
    result.data,
    res,
    "Profile data fetched successfully"
  );
});

// UPDATE DELIVERY PARTNER
const updateDeliveryPartnerController = catchAsync(async (req, res) => {
  const userId = req.user;
  const result = await deliverPartner.updateDeliveryPartner(
    userId,
    req.body,
    req.files
  );

  if (result?.success) {
    return messages.successResponse(
      result.data,
      res,
      "Profile updated successfully"
    );
  } else if (result?.data) {
    return messages.recordNotFound(res, "User not found");
  } else {
    return messages.failureResponse(result.error || "Update failed", res);
  }
});

module.exports = {
  registerDeliveryPartnerController,
  getDeliveryPartnerController,
  updateDeliveryPartnerController,
};
