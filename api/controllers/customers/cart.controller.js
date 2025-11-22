const cartService = require("../../services/cart.service");
const { catchAsync } = require("../../helpers/utils/catchAsync");
const message = require("../../helpers/utils/messages");

const addToCart = catchAsync(async (req, res) => {
  const userId = req.user;
  const { productId, quantity } = req.body;
  const result = await cartService.addToCart(userId, productId, quantity);
  if (!result.success)
    return message.failureResponse(
      result.error || "Failed to add to cart",
      res
    );
  return message.successResponse(
    result.data,
    res,
    "Item added to cart successfully"
  );
});

const getCart = catchAsync(async (req, res) => {
  const userId = req.user;
  const result = await cartService.getCart(userId);
  if (!result.success)
    return message.failureResponse(result.error || "Failed to get cart", res);
  return message.successResponse(
    result.data,
    res,
    "Cart retrieved successfully"
  );
});

const removeItem = catchAsync(async (req, res) => {
  const userId = req.user;
  const { productId } = req.params;
  const result = await cartService.removeItem(userId, productId);
  if (!result.success)
    return message.failureResponse(
      result.error || "Failed to remove item",
      res
    );
  return message.successResponse(result.data, res, "Item removed successfully");
});

const updateItemQuantity = catchAsync(async (req, res) => {
  const userId = req.user;
  const { productId } = req.params;
  const { quantity } = req.body;
  const result = await cartService.updateItemQuantity(
    userId,
    productId,
    quantity
  );
  if (!result.success)
    return message.failureResponse(
      result.error || "Failed to update item",
      res
    );
  return message.successResponse(
    result.data,
    res,
    "Item quantity updated successfully"
  );
});

module.exports = { addToCart, getCart, removeItem, updateItemQuantity };
