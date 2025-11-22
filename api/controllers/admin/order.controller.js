const orderService = require("../../services/order.service");
const { catchAsync } = require("../../helpers/utils/catchAsync");
const messages = require("../../helpers/utils/messages");

const getOrdersByVendor = catchAsync(async (req, res) => {
  const { vendorId } = req.params;
  const { limit, skip } = req.query;
  const result = await orderService.getOrdersForAdminByVendor(vendorId, {
    limit: parseInt(limit) || 50,
    skip: parseInt(skip) || 0,
  });
  if (!result.success)
    return messages.failureResponse(
      result.error || "Failed to fetch orders",
      res
    );
  return messages.successResponse(
    result.data,
    res,
    "Orders for vendor retrieved"
  );
});

const getOrderHistoryAdmin = catchAsync(async (req, res) => {
  const { orderId } = req.params;
  const result = await orderService.getOrderHistory(orderId);
  if (!result.success)
    return messages.failureResponse(
      result.error || "Failed to fetch history",
      res
    );
  return messages.successResponse(result.data, res, "Order history retrieved");
});

module.exports = { getOrdersByVendor, getOrderHistoryAdmin };
