const messages = require("../../helpers/utils/messages");
const { catchAsync } = require("../../helpers/utils/catchAsync");
const deliveryService = require("../../services/deliveryPartner.service");

const respondToOrder = catchAsync(async (req, res) => {
  const dpId = req.user;
  console.log("dpId: ", dpId);
  const { orderId } = req.params;
  console.log("orderId: ", orderId);
  const { accept } = req.body;
  console.log("accept: ", accept);

  const result = await deliveryService.dpRespondToOrder(dpId, orderId, accept);

  if (result?.error) return messages.failureResponse(result.error, res);
  if (result?.notFound) return messages.notFound("Order not found", res);

  return messages.successResponse(result, res, "Order response updated");
});

const pickupOrder = catchAsync(async (req, res) => {
  const dpId = req.user;
  const { orderId } = req.params;

  const result = await deliveryService.dpPickup(dpId, orderId);

  if (result?.error) return messages.failureResponse(result.error, res);
  if (result?.notFound) return messages.notFound("Order not found", res);

  return messages.successResponse(result, res, "Order picked up");
});

const deliverOrder = catchAsync(async (req, res) => {
  const dpId = req.user;
  const { orderId } = req.params;
  const { rating } = req.body;

  const result = await deliveryService.dpDeliver(dpId, orderId, rating);

  if (result?.error) return messages.failureResponse(result.error, res);
  if (result?.notFound) return messages.notFound("Order not found", res);

  return messages.successResponse(result, res, "Order delivered");
});

const getMyDeliveryStats = catchAsync(async (req, res) => {
  const dpId = req.user._id;
  const result = await deliveryService.getDpStats(dpId);

  if (result?.error) return messages.failureResponse(result.error, res);

  return messages.successResponse(result, res, "Stats fetched successfully");
});

module.exports = {
  respondToOrder,
  pickupOrder,
  deliverOrder,
  getMyDeliveryStats,
};
