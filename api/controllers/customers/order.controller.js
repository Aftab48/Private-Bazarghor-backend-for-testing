const orderService = require("../../services/order.service");
const { catchAsync } = require("../../helpers/utils/catchAsync");
const message = require("../../helpers/utils/messages");

const createOrder = catchAsync(async (req, res) => {
  const userId = req.user;
  const address = req.body.address || {};
  const saveAddress = !!req.body.saveAddress; // if true, save this address to user's customerAddress
  const result = await orderService.createOrderFromCart(userId, address, {
    clearCart: true,
    saveAddress,
  });
  if (!result.success)
    return message.failureResponse(
      result.error || "Failed to create order",
      res
    );
  return message.successResponse(
    result.data,
    res,
    "Order created successfully"
  );
});

const getOrders = catchAsync(async (req, res) => {
  const userId = req.user;
  const { limit, skip } = req.query;
  const result = await orderService.getOrdersForUser(userId, {
    limit: parseInt(limit) || 50,
    skip: parseInt(skip) || 0,
  });
  if (!result.success)
    return message.failureResponse(result.error || "Failed to get orders", res);
  return message.successResponse(
    result.data,
    res,
    "Orders retrieved successfully"
  );
});

const getOrderById = catchAsync(async (req, res) => {
  const userId = req.user;
  const { orderId } = req.params;
  const result = await orderService.getOrderById(userId, orderId);
  if (!result.success)
    return message.failureResponse(result.error || "Order not found", res);
  return message.successResponse(
    result.data,
    res,
    "Order retrieved successfully"
  );
});

const addHistory = catchAsync(async (req, res) => {
  const { orderId } = req.params;
  const { status, note } = req.body;
  const changedBy = req.user;
  const result = await orderService.addOrderHistory(orderId, {
    status,
    note,
    changedBy,
  });
  if (!result.success)
    return message.failureResponse(
      result.error || "Failed to add history",
      res
    );
  return message.successResponse(result.data, res, "Order history updated");
});

const updatePaymentStatus = catchAsync(async (req, res) => {
  const { orderId } = req.params;
  const { paymentStatus, transactionInfo } = req.body;
  const result = await orderService.updatePaymentStatus(
    orderId,
    paymentStatus,
    transactionInfo || null
  );
  if (!result.success)
    return message.failureResponse(
      result.error || "Failed to update payment status",
      res
    );
  return message.successResponse(result.data, res, "Payment status updated");
});

const getOrderHistory = catchAsync(async (req, res) => {
  const { orderId } = req.params;
  const result = await orderService.getOrderHistory(orderId);
  if (!result.success)
    return message.failureResponse(
      result.error || "Failed to get history",
      res
    );
  return message.successResponse(result.data, res, "Order history retrieved");
});

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  addHistory,
  updatePaymentStatus,
  getOrderHistory,
};
