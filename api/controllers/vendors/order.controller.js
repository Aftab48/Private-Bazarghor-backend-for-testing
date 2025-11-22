const orderService = require("../../services/order.service");
const { catchAsync } = require("../../helpers/utils/catchAsync");
const messages = require("../../helpers/utils/messages");

const respondToOrder = catchAsync(async (req, res) => {
  const vendorId = req.user;
  const { orderId } = req.params;
  const { accept, note } = req.body; // accept: true/false
  const result = await orderService.vendorRespondToOrder(
    vendorId,
    orderId,
    !!accept,
    note
  );
  if (!result.success)
    return messages.failureResponse(
      result.error || "Failed to respond to order",
      res
    );
  return messages.successResponse(result.data, res, "Vendor response recorded");
});

const getVendorOrders = catchAsync(async (req, res) => {
  const vendorId = req.user;
  const { limit, skip } = req.query;
  const result = await orderService.getOrdersForVendor(vendorId, {
    limit: parseInt(limit) || 50,
    skip: parseInt(skip) || 0,
  });
  if (!result.success)
    return messages.failureResponse(
      result.error || "Failed to fetch orders",
      res
    );
  return messages.successResponse(result.data, res, "Vendor orders retrieved");
});

const getVendorOrderById = catchAsync(async (req, res) => {
  const vendorId = req.user;
  const { orderId } = req.params;
  const result = await orderService.getVendorOrderById(vendorId, orderId);
  if (!result.success)
    return messages.failureResponse(result.error || "Order not found", res);
  return messages.successResponse(result.data, res, "Vendor order retrieved");
});

module.exports = { respondToOrder, getVendorOrders, getVendorOrderById };
