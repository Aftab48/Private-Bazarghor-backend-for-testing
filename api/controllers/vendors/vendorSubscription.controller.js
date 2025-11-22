const vendorSubscriptionService = require("../../services/vendorSubscription.service");
const messages = require("../../helpers/utils/messages");
const { catchAsync } = require("../../helpers/utils/catchAsync");

const createSubscriptionController = catchAsync(async (req, res) => {
  const vendorId = req.user; // FIX: correct vendor ID
  const { storeId, planName, autoRenew } = req.body;

  const result = await vendorSubscriptionService.purchaseSubscription({
    vendorId,
    storeId,
    planName,
    autoRenew,
    updatedBy: vendorId, // track who created this subscription
  });

  if (result.success) {
    return messages.successResponse(
      result.data,
      res,
      "Subscription created successfully"
    );
  }

  return messages.failureResponse(
    result.error || "Failed to create subscription",
    res
  );
});

const getMySubscriptionsController = catchAsync(async (req, res) => {
  const vendorId = req.user;
  const { limit = 50, skip = 0 } = req.query;
  const result = await vendorSubscriptionService.getSubscriptionsForVendor(
    vendorId,
    { limit, skip }
  );
  if (result.success)
    return messages.successResponse(result.data, res, "Subscriptions fetched");
  return messages.failureResponse(
    result.error || "Failed to fetch subscriptions",
    res
  );
});

// const getSubscriptionByIdController = catchAsync(async (req, res) => {
//   const { id } = req.params;
//   const result = await vendorSubscriptionService.getSubscriptionById(id);
//   if (result.success)
//     return messages.successResponse(result.data, res, "Subscription fetched");
//   if (result.notFound) return messages.notFound("Subscription not found", res);
//   return messages.failureResponse(
//     result.error || "Failed to fetch subscription",
//     res
//   );
// });

// const cancelSubscriptionController = catchAsync(async (req, res) => {
//   const { id } = req.params;
//   const result = await vendorSubscriptionService.cancelSubscription(id);
//   if (result.success)
//     return messages.successResponse(result.data, res, "Subscription cancelled");
//   if (result.notFound) return messages.notFound("Subscription not found", res);
//   return messages.failureResponse(
//     result.error || "Failed to cancel subscription",
//     res
//   );
// });

const renewSubscriptionByVendor = catchAsync(async (req, res) => {
  const { id } = req.params;

  // Who is renewing the subscription?
  // vendor → req.user.role = "vendor"
  // admin  → req.user.role = "admin/super_admin"
  const updatedBy = req.user;
  const payload = {
    autoRenew: req.body?.autoRenew,
    updatedBy, // Always pass updatedBy
    requestedByRole: req.user?.roles?.[0]?.code, // to detect vendor/admin
    requesterId: req.user,
  };

  const result = await vendorSubscriptionService.renewSubscription(id, payload);

  if (result.success) {
    return messages.successResponse(
      result.data,
      res,
      result.message || "Subscription renewed"
    );
  }

  if (result.notFound) return messages.notFound("Subscription not found", res);

  return messages.failureResponse(
    result.error || "Failed to renew subscription",
    res
  );
});

module.exports = {
  createSubscriptionController,
  getMySubscriptionsController,
  renewSubscriptionByVendor,
  // getSubscriptionByIdController,
  // cancelSubscriptionController,
};
