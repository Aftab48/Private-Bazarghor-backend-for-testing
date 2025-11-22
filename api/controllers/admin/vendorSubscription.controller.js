const vendorSubscriptionService = require("../../services/vendorSubscription.service");
const messages = require("../../helpers/utils/messages");
const { catchAsync } = require("../../helpers/utils/catchAsync");
const mongoose = require("mongoose");
const Store = require("../../models/store");

const createSubscription = catchAsync(async (req, res) => {
  const payload = req.body;
  const result = await vendorSubscriptionService.purchaseSubscription(payload);
  if (result.success)
    return messages.successResponse(result.data, res, "Subscription created");
  return messages.failureResponse(
    result.error || "Failed to create subscription",
    res
  );
});

const listSubscriptions = catchAsync(async (req, res) => {
  const { limit = 50, skip = 0 } = req.query;
  const subs = await vendorSubscriptionService.getSubscriptionsForVendor(null, {
    limit,
    skip,
  });
  return messages.successResponse(subs.data, res, "Subscriptions fetched");
});

const getSubscriptionById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await vendorSubscriptionService.getSubscriptionById(id);
  if (result.success)
    return messages.successResponse(result.data, res, "Subscription fetched");
  if (result.notFound) return messages.notFound("Subscription not found", res);
  return messages.failureResponse(
    result.error || "Failed to fetch subscription",
    res
  );
});

const assignSubscriptionToStore = catchAsync(async (req, res) => {
  const { subscriptionId } = req.params;
  const { storeId } = req.body;
  if (!subscriptionId || !mongoose.Types.ObjectId.isValid(subscriptionId))
    return messages.insufficientParameters(
      res,
      "Valid subscriptionId required"
    );
  if (!storeId || !mongoose.Types.ObjectId.isValid(storeId))
    return messages.insufficientParameters(res, "Valid storeId required");
  const resSub = await vendorSubscriptionService.getSubscriptionById(
    subscriptionId
  );
  if (!resSub.success) return messages.notFound("Subscription not found", res);
  const VendorSubscription = require("../../models/vendorSubscription");
  const subDoc = await VendorSubscription.findById(subscriptionId);
  subDoc.storeId = storeId;
  await subDoc.save();
  await Store.findByIdAndUpdate(storeId, {
    $set: {
      subscriptionId: subDoc._id,
      subscriptionPlan: subDoc.planName,
      subscriptionExpiresAt: subDoc.endDate,
    },
  });
  return messages.successResponse(
    subDoc,
    res,
    "Subscription assigned to store"
  );
});

const cancelSubscription = catchAsync(async (req, res) => {
  const { id } = req.params;
  const updatedBy = req.user;

  const result = await vendorSubscriptionService.cancelSubscription(
    id,
    updatedBy
  );

  if (result.success)
    return messages.successResponse(result.data, res, "Subscription cancelled");

  if (result.notFound) return messages.notFound("Subscription not found", res);

  return messages.failureResponse(
    result.error || "Failed to cancel subscription",
    res
  );
});

const renewSubscription = catchAsync(async (req, res) => {
  const { id } = req.params;
  const payload = req.body;
  const result = await vendorSubscriptionService.renewSubscription(id, payload);
  if (result.success)
    return messages.successResponse(result.data, res, "Subscription renewed");
  if (result.notFound) return messages.notFound("Subscription not found", res);
  return messages.failureResponse(
    result.error || "Failed to renew subscription",
    res
  );
});

module.exports = {
  createSubscription,
  listSubscriptions,
  getSubscriptionById,
  assignSubscriptionToStore,
  cancelSubscription,
  renewSubscription,
};
