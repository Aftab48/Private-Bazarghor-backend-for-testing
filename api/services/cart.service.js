const Cart = require("../models/cart");
const Product = require("../models/product");
const Store = require("../models/store");
const mongoose = require("mongoose");
const { CART_CONSTANTS } = require("../../config/constants/cartConstant");
const { computeCartTotals } = require("../helpers/utils/comman");
const logger = require("../helpers/utils/logger");

const addToCart = async (userId, productId, quantity = 1) => {
  try {
    if (!userId) return { success: false, error: "User id required" };

    if (!productId || !mongoose.Types.ObjectId.isValid(productId))
      return { success: false, error: "Valid productId required" };

    quantity = parseInt(quantity) || 1;
    if (quantity < 1) return { success: false, error: "Quantity must be >= 1" };

    const product = await Product.findOne({
      _id: productId,
      deletedAt: null,
    }).lean();
    if (!product)
      return { success: false, notFound: true, error: "Product not found" };
    if (!product.isActive)
      return { success: false, error: "Product not available" };
    if (product.quantity < quantity)
      return { success: false, error: "Not enough stock" };

    const store = await Store.findById(product.storeId).lean();
    if (!store || !store.isApproved || !store.isStoreOpen) {
      return { success: false, error: "Store is not available" };
    }

    let cart = await Cart.findOne({ userId, status: CART_CONSTANTS.ACTIVE });
    if (!cart) {
      cart = await Cart.create({ userId, items: [] });
    }

    const existingIndex = cart.items.findIndex(
      (i) => String(i.productId) === String(productId)
    );
    if (existingIndex !== -1) {
      cart.items[existingIndex].quantity += quantity;
    } else {
      cart.items.push({
        productId: product._id,
        storeId: product.storeId,
        quantity,
        productName: product.productName,
        productImage: product.productImages?.[0] || null,
        storeName: (store && store.storeName) || null,
      });
    }

    await cart.save();
    const totals = await computeCartTotals(cart);
    const updated = await Cart.findById(cart._id).lean();
    updated.subTotal = totals.subTotal;
    updated.grandTotal = totals.grandTotal;
    return { success: true, data: updated };
  } catch (err) {
    logger.error("Add to cart error:", err);
    return {
      success: false,
      error: err.message || "Failed to add item to cart",
    };
  }
};

const getCart = async (userId) => {
  try {
    if (!userId) return { success: false, error: "User id required" };
    const cart = await Cart.findOne({ userId, status: CART_CONSTANTS.ACTIVE })
      .populate(
        "items.productId",
        "productName price productImages quantity status isActive"
      )
      .lean();
    if (!cart) return { success: true, data: { userId, items: [] } };

    let subTotal = 0;
    for (const it of cart.items) {
      const prod = it.productId; // populated product
      const currentPrice =
        prod && typeof prod.price === "number" ? prod.price : 0;
      it.currentPrice = currentPrice;
      it.totalPrice = currentPrice * (it.quantity || 0);
      subTotal += it.totalPrice;
    }
    cart.subTotal = subTotal;
    cart.grandTotal = subTotal; // delivery/taxes handled at order
    return { success: true, data: cart };
  } catch (err) {
    logger.error("Get cart error:", err);
    return { success: false, error: err.message || "Failed to get cart" };
  }
};

const removeItem = async (userId, productId) => {
  try {
    if (!userId) return { success: false, error: "User id required" };

    if (!productId) return { success: false, error: "Product id required" };

    const cart = await Cart.findOne({ userId, status: CART_CONSTANTS.ACTIVE });
    if (!cart) return { success: false, notFound: true };
    cart.items = cart.items.filter(
      (i) => String(i.productId) !== String(productId)
    );

    await cart.save();
    const totals = await computeCartTotals(cart);
    const updated = await Cart.findById(cart._id).lean();
    updated.subTotal = totals.subTotal;
    updated.grandTotal = totals.grandTotal;
    return { success: true, data: updated };
  } catch (err) {
    logger.error("Remove item from cart error:", err);
    return {
      success: false,
      error: err.message || "Failed to remove item from cart",
    };
  }
};

const updateItemQuantity = async (userId, productId, quantity) => {
  try {
    if (!userId) return { success: false, error: "User id required" };
    if (!productId) return { success: false, error: "Product id required" };

    quantity = parseInt(quantity) || 1;
    if (quantity < 1) return { success: false, error: "Quantity must be >= 1" };

    const product = await Product.findOne({
      _id: productId,
      deletedAt: null,
    }).lean();

    if (!product)
      return { success: false, notFound: true, error: "Product not found" };
    if (!product.isActive)
      return { success: false, error: "Product not available" };

    if (product.quantity < quantity)
      return { success: false, error: "Not enough stock" };

    const cart = await Cart.findOne({ userId, status: CART_CONSTANTS.ACTIVE });
    if (!cart) return { success: false, notFound: true };

    const idx = cart.items.findIndex(
      (i) => String(i.productId) === String(productId)
    );

    if (idx === -1) return { success: false, error: "Item not found in cart" };
    cart.items[idx].quantity = quantity;
    await cart.save();
    // recompute totals using live product prices
    const totals = await computeCartTotals(cart);
    const updated = await Cart.findById(cart._id).lean();
    updated.subTotal = totals.subTotal;
    updated.grandTotal = totals.grandTotal;
    return { success: true, data: updated };
  } catch (err) {
    logger.error("Update item quantity error:", err);
    return {
      success: false,
      error: err.message || "Failed to update item quantity",
    };
  }
};

module.exports = {
  addToCart,
  getCart,
  removeItem,
  updateItemQuantity,
};
