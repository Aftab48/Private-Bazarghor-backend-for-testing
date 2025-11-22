const Product = require("../../models/product");
const Counter = require("../../models/order.counter");

const generateOtp = (prev) => {
  let code = "";
  for (let i = 0; i < 5; i++) {
    code = String(Math.floor(100000 + Math.random() * 900000));
    if (!prev || code !== prev) break;
  }
  return code;
};

const computeCartTotals = async (cart) => {
  if (!cart || !cart.items || cart.items.length === 0) {
    return { subTotal: 0, grandTotal: 0 };
  }
  const productIds = cart.items.map((i) => i.productId);
  const products = await Product.find({
    _id: { $in: productIds },
    deletedAt: null,
  }).lean();
  const priceMap = new Map(products.map((p) => [String(p._id), p.price || 0]));
  let subTotal = 0;
  for (const it of cart.items) {
    const price = priceMap.get(String(it.productId)) || 0;
    subTotal += price * (it.quantity || 0);
  }
  const grandTotal = subTotal;
  return { subTotal, grandTotal };
};

const calculateDeliveryPartnerBaseFee = (distanceKm) => {
  if (distanceKm === null || distanceKm === undefined) {
    return FEE_CONSTANTS.DELIVERY_PARTNER_BASE_FEE_MIN || 25;
  }

  for (const slab of FEE_CONSTANTS.DELIVERY_SLABS) {
    if (distanceKm >= slab.min && distanceKm <= slab.max) {
      return slab.fee;
    }
  }
  return FEE_CONSTANTS.DELIVERY_PARTNER_BASE_FEE_MAX || 30;
};

const calculateDeliveryPartnerIncentive = (dailyOrderCount) => {
  const threshold = FEE_CONSTANTS.DELIVERY_PARTNER_INCENTIVE_THRESHOLD || 10;
  if (dailyOrderCount > threshold) {
    // Random between min and max, or use average
    const min = FEE_CONSTANTS.DELIVERY_PARTNER_INCENTIVE_MIN || 5;
    const max = FEE_CONSTANTS.DELIVERY_PARTNER_INCENTIVE_MAX || 10;
    return parseFloat(((min + max) / 2).toFixed(2)); // Use average for consistency
  }
  return 0;
};

const generateOrderNumber = async () => {
  const pad = (n, w = 3) => String(n).padStart(w, "0");
  const now = new Date();
  const y = now.getFullYear();
  const m = pad(now.getMonth() + 1, 2);
  const d = pad(now.getDate(), 2);

  const counter = await Counter.findOneAndUpdate(
    { name: `order-${y}${m}${d}` }, // unique key for each day
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  return `ORD-${y}${m}${d}-${pad(counter.seq)}`;
};

module.exports = {
  generateOtp,
  computeCartTotals,
  generateOrderNumber,
  calculateDeliveryPartnerBaseFee,
  calculateDeliveryPartnerIncentive,
};
