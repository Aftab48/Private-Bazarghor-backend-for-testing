const Order = require("../models/order");
const OrderHistory = require("../models/orderHistory");
const Cart = require("../models/cart");
const Product = require("../models/product");
const Store = require("../models/store");
const User = require("../models/user");
const mongoose = require("mongoose");
const {
  ORDER_CONSTANTS,
  ORDER_HISTORY_CONSTANTS,
} = require("../../config/constants/orderConstant");
const { FEE_CONSTANTS } = require("../../config/constants/feeConstant");
const VendorSubscription = require("../models/vendorSubscription");
const { formatDate } = require("../helpers/utils/date");
const {
  generateOrderNumber,
  calculateDeliveryPartnerBaseFee,
  calculateDeliveryPartnerIncentive,
} = require("../helpers/utils/comman");
const { assignDeliveryPartner } = require("./deliveryPartner.service");

const getDeliveryPartnerDailyOrderCount = async (
  deliveryPartnerId,
  date = new Date()
) => {
  if (!deliveryPartnerId) return 0;

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  try {
    const count = await Order.countDocuments({
      deliveryPartnerId,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      status: {
        $in: [
          ORDER_CONSTANTS.DELIVERED,
          ORDER_CONSTANTS.COMPLETED,
          ORDER_CONSTANTS.PROCESSING,
        ],
      },
    });
    return count || 0;
  } catch (err) {
    return 0;
  }
};

const createOrderFromCart = async (
  userId,
  address = {},
  { clearCart = true, saveAddress = false } = {}
) => {
  if (!userId) return { success: false, error: "User id required" };

  const cart = await Cart.findOne({ userId }).lean();
  if (!cart || !cart.items || cart.items.length === 0) {
    return { success: false, error: "Cart is empty", notFound: true };
  }

  const items = [];
  let subtotal = 0;

  // aggregate items and validate
  for (const ci of cart.items) {
    const prod = await Product.findOne({
      _id: ci.productId,
      deletedAt: null,
    }).lean();
    if (!prod)
      return {
        success: false,
        notFound: true,
        error: `Product not found: ${ci.productId}`,
      };
    if (!prod.isActive)
      return {
        success: false,
        error: `Product not available: ${ci.productId}`,
      };
    if (prod.quantity < ci.quantity)
      return {
        success: false,
        error: `Not enough stock for product ${ci.productId}`,
      };

    const store = await Store.findById(prod.storeId).lean();
    if (!store || !store.isApproved || !store.isStoreOpen) {
      return {
        success: false,
        error: `Store not available for product ${ci.productId}`,
      };
    }

    const itemPrice = prod.price || 0;
    const linePrice = parseFloat((itemPrice * ci.quantity).toFixed(2));
    subtotal += linePrice;

    items.push({
      productId: prod._id,
      storeId: prod.storeId,
      quantity: ci.quantity,
      price: itemPrice,
      productName: prod.productName || prod.name || "",
      productImage:
        prod.productImages && prod.productImages.length
          ? prod.productImages[0]
          : ci.productImage || null,
    });
  }

  // compute order-level basic amounts
  const tax = parseFloat(
    (subtotal * (FEE_CONSTANTS.DEFAULT_TAX_PERCENT || 0)).toFixed(2)
  );
  const shipping = parseFloat(
    (FEE_CONSTANTS.DEFAULT_DELIVERY_CHARGE || 0).toFixed(2)
  );
  const totalAmount = parseFloat((subtotal + tax + shipping).toFixed(2));

  // resolve address early so we can compute distances per-store
  let resolvedAddress = null;
  try {
    if (address && (address._id || address.id)) {
      const user = await User.findById(userId).lean();
      if (user && Array.isArray(user.customerAddress)) {
        const aid = address._id || address.id;
        const found = user.customerAddress.find(
          (a) => String(a._id) === String(aid)
        );
        if (found) resolvedAddress = found;
      }
    }
    if (
      !resolvedAddress &&
      address &&
      typeof address === "object" &&
      (address.addressLine1 || address.city || address.pinCode)
    ) {
      resolvedAddress = {
        addressLine1: address.addressLine1 || "",
        addressLine2: address.addressLine2 || "",
        city: address.city || "",
        state: address.state || "",
        pinCode: address.pinCode || address.postalCode || "",
        landmark: address.landmark || "",
        addressType: address.addressType || "home",
        isDefault: !!address.isDefault,
        lat: address.lat != null ? address.lat : address.latitude || null,
        lng: address.lng != null ? address.lng : address.longitude || null,
      };

      if (saveAddress) {
        const userDoc = await User.findById(userId);
        if (userDoc) {
          if (resolvedAddress.isDefault) {
            (userDoc.customerAddress || []).forEach(
              (a) => (a.isDefault = false)
            );
          }
          userDoc.customerAddress = userDoc.customerAddress || [];
          userDoc.customerAddress.push(resolvedAddress);
          await userDoc.save();
          const saved =
            userDoc.customerAddress[userDoc.customerAddress.length - 1];
          resolvedAddress = saved;
        }
      }
    }
  } catch (err) {
    resolvedAddress = resolvedAddress || address;
  }

  // compute per-store breakdown and commission splits
  const storeMap = new Map(); // storeId -> { subtotal }
  for (const it of items) {
    const sid = String(it.storeId);
    if (!storeMap.has(sid)) storeMap.set(sid, { subtotal: 0, items: [] });
    const entry = storeMap.get(sid);
    const line = parseFloat((it.price * it.quantity).toFixed(2));
    entry.subtotal = parseFloat((entry.subtotal + line).toFixed(2));
    entry.items.push(it);
  }

  const storeBreakdown = [];
  let commissionTotal = 0;
  let vendorTotal = 0;
  let platformTotal = 0;
  let totalDeliveryCharge = 0;
  let totalDeliveryCustomer = 0;
  let totalDeliveryVendor = 0;
  let totalDeliveryPlatform = 0;

  for (const [sid, val] of storeMap.entries()) {
    const storeSubtotal = val.subtotal;
    const storeTax = parseFloat(
      (storeSubtotal * (FEE_CONSTANTS.DEFAULT_TAX_PERCENT || 0)).toFixed(2)
    );

    // fetch store doc for location and subscription info
    let storeDoc = null;
    try {
      storeDoc = await Store.findById(sid).lean();
    } catch (err) {
      storeDoc = null;
    }

    // compute distance from store to delivery address if possible
    let distanceKm = null;
    if (
      storeDoc &&
      storeDoc.location &&
      storeDoc.location.lat != null &&
      storeDoc.location.lng != null &&
      resolvedAddress &&
      resolvedAddress.lat != null &&
      resolvedAddress.lng != null
    ) {
      const toRad = (v) => (v * Math.PI) / 180;
      const haversineKm = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // km
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(toRad(lat1)) *
            Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      };
      distanceKm = parseFloat(
        haversineKm(
          storeDoc.location.lat,
          storeDoc.location.lng,
          resolvedAddress.lat,
          resolvedAddress.lng
        ).toFixed(2)
      );
    }

    // if distance known and beyond 15km, not eligible for delivery
    if (distanceKm !== null && distanceKm > 15) {
      return {
        success: false,
        error: `Delivery not available beyond 15 km for store ${sid}`,
      };
    }

    // determine store-specific shipping (per-store delivery fee based on distance)
    const getDeliveryFeeForDistance = (distanceKm) => {
      if (distanceKm === null)
        return FEE_CONSTANTS.DEFAULT_DELIVERY_CHARGE || 25;
      for (const slab of FEE_CONSTANTS.DELIVERY_SLABS) {
        if (distanceKm >= slab.min && distanceKm <= slab.max) return slab.fee;
      }
      return null;
    };

    const storeShipping = (() => {
      const fee = getDeliveryFeeForDistance(distanceKm);
      if (fee === null) return 0; // treat null as zero fallback
      return fee;
    })();

    const storeTotal = parseFloat(
      (storeSubtotal + storeTax + storeShipping).toFixed(2)
    );

    // determine commissionPercent: explicit commissionPercent -> active subscription doc -> plan -> default
    let commissionPercent = FEE_CONSTANTS.PLATFORM_COMMISSION_PERCENT || 0.1;
    if (storeDoc) {
      if (typeof storeDoc.commissionPercent === "number") {
        commissionPercent = storeDoc.commissionPercent;
      } else if (storeDoc.subscriptionId) {
        try {
          const sub = await VendorSubscription.findById(
            storeDoc.subscriptionId
          ).lean();
          if (
            sub &&
            sub.status === "active" &&
            (!sub.endDate || new Date(sub.endDate) > new Date())
          ) {
            commissionPercent =
              typeof sub.commissionPercent === "number"
                ? sub.commissionPercent
                : commissionPercent;
          }
        } catch (err) {
          // ignore and fallback
        }
      } else if (
        storeDoc.subscriptionPlan &&
        FEE_CONSTANTS.VENDOR_PLANS[storeDoc.subscriptionPlan]
      ) {
        commissionPercent =
          FEE_CONSTANTS.VENDOR_PLANS[storeDoc.subscriptionPlan]
            .commissionPercent;
      }
    }

    const commissionAmount = parseFloat(
      (storeSubtotal * commissionPercent).toFixed(2)
    );
    const platformShare = commissionAmount;
    const vendorShare = parseFloat((storeTotal - commissionAmount).toFixed(2));

    commissionTotal = parseFloat(
      (commissionTotal + commissionAmount).toFixed(2)
    );
    platformTotal = parseFloat((platformTotal + platformShare).toFixed(2));
    vendorTotal = parseFloat((vendorTotal + vendorShare).toFixed(2));

    // accumulate delivery charges (per-store)
    totalDeliveryCharge = parseFloat(
      (totalDeliveryCharge + storeShipping).toFixed(2)
    );

    storeBreakdown.push({
      storeId: sid,
      subtotal: storeSubtotal,
      tax: storeTax,
      shipping: storeShipping,
      distanceKm,
      total: storeTotal,
      commissionPercent,
      commissionAmount,
      vendorShare,
      platformShare,
    });
  }

  // Determine who pays delivery charge for each store and overall
  // Calculate order value (subtotal + tax) for free delivery threshold checks
  const orderValue = parseFloat((subtotal + tax).toFixed(2));

  const userDoc = await User.findById(userId).lean();
  const customerPlanName =
    userDoc && userDoc.platformSubscription
      ? userDoc.platformSubscription.planName || null
      : null;

  for (const sb of storeBreakdown) {
    const storeShip = sb.shipping || 0;
    totalDeliveryCharge = parseFloat(
      (totalDeliveryCharge + storeShip).toFixed(2)
    );

    let customerPays = storeShip;
    let vendorPays = 0;
    let platformPays = 0;

    if (orderValue >= (FEE_CONSTANTS.FREE_DELIVERY_THRESHOLD || 199)) {
      customerPays = 0;
      vendorPays = parseFloat((storeShip / 2).toFixed(2));
      platformPays = parseFloat((storeShip - vendorPays).toFixed(2));
    } else if (
      customerPlanName &&
      typeof customerPlanName === "string" &&
      customerPlanName.toLowerCase().includes("super saver")
    ) {
      const cfg = FEE_CONSTANTS.CUSTOMER_PLANS.SUPER_SAVER;
      if (orderValue >= (cfg.freeDeliveryAbove || 99)) {
        customerPays = 0;
        platformPays = storeShip;
      }
    } else if (
      customerPlanName &&
      typeof customerPlanName === "string" &&
      customerPlanName.toLowerCase().includes("smart saver")
    ) {
      const cfg = FEE_CONSTANTS.CUSTOMER_PLANS.SMART_SAVER;
      if (orderValue >= (cfg.freeDeliveryAbove || 149)) {
        customerPays = 0;
        platformPays = storeShip;
      }
    }

    totalDeliveryCustomer = parseFloat(
      (totalDeliveryCustomer + customerPays).toFixed(2)
    );
    totalDeliveryVendor = parseFloat(
      (totalDeliveryVendor + vendorPays).toFixed(2)
    );
    totalDeliveryPlatform = parseFloat(
      (totalDeliveryPlatform + platformPays).toFixed(2)
    );
  }

  let cashback = 0;
  const finalTotalAmount = parseFloat(
    (subtotal + tax + totalDeliveryCharge).toFixed(2)
  );

  if (
    customerPlanName &&
    typeof customerPlanName === "string" &&
    customerPlanName.toLowerCase().includes("super saver")
  ) {
    const cfg = FEE_CONSTANTS.CUSTOMER_PLANS.SUPER_SAVER;
    if (finalTotalAmount >= 299 && cfg.cashbackPercent) {
      cashback = parseFloat(
        (finalTotalAmount * cfg.cashbackPercent).toFixed(2)
      );
      // credit to user wallet
      try {
        await User.findByIdAndUpdate(userId, {
          $inc: { walletBalance: cashback },
        });
      } catch (err) {
        logger.error("Error from Cashback", err);
      }
    }
  }

  let overallDistanceKm = null;
  if (storeBreakdown && storeBreakdown.length > 0) {
    const distances = storeBreakdown
      .map((sb) => sb.distanceKm)
      .filter((d) => d !== null && d !== undefined);
    if (distances.length > 0) {
      overallDistanceKm = Math.max(...distances);
    }
  }

  // Calculate delivery partner base fee (incentive and tip will be calculated when order is delivered)
  const deliveryPartnerBaseFee =
    calculateDeliveryPartnerBaseFee(overallDistanceKm);

  let order = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      order = await Order.create({
        orderNumber: await generateOrderNumber(),
        userId,
        items,
        subtotal,
        tax,
        shipping: totalDeliveryCharge,
        deliveryCharge: totalDeliveryCharge,
        deliveryChargeCustomer: totalDeliveryCustomer,
        deliveryChargeVendor: totalDeliveryVendor,
        deliveryChargePlatform: totalDeliveryPlatform,
        totalAmount: finalTotalAmount,
        address: resolvedAddress || {},
        status: ORDER_CONSTANTS.CREATED,
        paymentStatus: "pending",
        distanceKm: overallDistanceKm,
        storeBreakdown,
        commissionTotal,
        vendorTotal,
        platformTotal,
        platformRewards: { cashback },
        deliveryPartnerEarnings: {
          baseFee: deliveryPartnerBaseFee,
          incentive: 0, // Will be calculated when order is delivered
          tip: 0, // Will be set when customer adds tip
          total: deliveryPartnerBaseFee,
        },
      });
      break;
    } catch (err) {
      // Duplicate key on orderNumber, retry generation
      if (err?.code === 11000 && attempt < 4) continue;
      throw err;
    }
  }

  const initHistory = await OrderHistory.create({
    orderId: order._id,
    status: ORDER_CONSTANTS.CREATED,
    orderNumber: order.orderNumber,
    note: "Order created from cart",
    changedBy: userId,
    timestamp: formatDate(new Date()),
  });

  const orderObj = order.toObject ? order.toObject() : order;
  orderObj.history = [initHistory];

  if (clearCart) {
    await Cart.updateOne({ userId }, { $set: { items: [] } });
  }

  return { success: true, data: orderObj };
};

const getOrdersForUser = async (userId, { limit = 50, skip = 0 } = {}) => {
  if (!userId) return { success: false, error: "User id required" };
  const orders = await Order.find({ userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
  return { success: true, data: orders };
};

const getOrderById = async (userId, orderId) => {
  if (!userId) return { success: false, error: "User id required" };
  if (!orderId || !mongoose.Types.ObjectId.isValid(orderId))
    return { success: false, error: "Valid orderId required" };
  const order = await Order.findOne({ _id: orderId, userId }).lean();
  if (!order) return { success: false, notFound: true };
  const history = await OrderHistory.find({ orderId })
    .sort({ timestamp: 1 })
    .lean();
  order.history = history;
  return { success: true, data: order };
};

const addOrderHistory = async (
  orderId,
  { status, note = null, changedBy = null }
) => {
  if (!orderId || !mongoose.Types.ObjectId.isValid(orderId))
    return { success: false, error: "Valid orderId required" };
  if (!status) return { success: false, error: "Status required" };

  const entry = await OrderHistory.create({
    orderId,
    orderNumber:
      (
        await Order.findById(orderId).select("orderNumber").lean()
      )?.orderNumber || null,
    status,
    note,
    changedBy,
    timestamp: formatDate(new Date()),
  });

  const order = await Order.findByIdAndUpdate(
    orderId,
    { $set: { status } },
    { new: true }
  ).lean();
  if (!order) return { success: false, notFound: true };

  const history = await OrderHistory.find({ orderId })
    .sort({ timestamp: 1 })
    .lean();
  order.history = history;
  return { success: true, data: order };
};

const updatePaymentStatus = async (
  orderId,
  paymentStatus,
  transactionInfo = null
) => {
  if (!orderId || !mongoose.Types.ObjectId.isValid(orderId))
    return { success: false, error: "Valid orderId required" };
  const valid = ["pending", "paid", "failed", "refunded"];
  if (!valid.includes(paymentStatus))
    return { success: false, error: "Invalid paymentStatus" };

  const historyNote = transactionInfo
    ? `Payment: ${paymentStatus} (${JSON.stringify(transactionInfo)})`
    : `Payment: ${paymentStatus}`;

  await OrderHistory.create({
    orderId,
    orderNumber:
      (
        await Order.findById(orderId).select("orderNumber").lean()
      )?.orderNumber || null,
    status: `payment_${paymentStatus}`,
    note: historyNote,
    changedBy: null,
    timestamp: formatDate(new Date()),
  });

  const order = await Order.findByIdAndUpdate(
    orderId,
    { $set: { paymentStatus } },
    { new: true }
  ).lean();
  if (!order) return { success: false, notFound: true };

  const history = await OrderHistory.find({ orderId })
    .sort({ timestamp: 1 })
    .lean();
  order.history = history;
  return { success: true, data: order };
};

const getOrderHistory = async (orderId) => {
  if (!orderId || !mongoose.Types.ObjectId.isValid(orderId))
    return { success: false, error: "Valid orderId required" };
  const history = await OrderHistory.find({ orderId })
    .sort({ timestamp: 1 })
    .lean();
  return { success: true, data: history };
};

const vendorRespondToOrder = async (
  vendorId,
  orderId,
  accept = true,
  note = null
) => {
  if (!vendorId) return { success: false, error: "Vendor id required" };
  if (!orderId || !mongoose.Types.ObjectId.isValid(orderId))
    return { success: false, error: "Valid orderId required" };

  // Fetch order and vendor's stores
  const [order, stores] = await Promise.all([
    Order.findById(orderId).lean(),
    Store.find({ vendorId }).select("_id").lean(),
  ]);

  if (!order) return { success: false, notFound: true };

  const vendorStoreIds = stores.map((s) => String(s._id));
  const orderStoreIds = Array.from(
    new Set(order.items.map((i) => String(i.storeId)))
  );

  // Find stores of this vendor present in this order
  const relevantStoreIds = orderStoreIds.filter((sid) =>
    vendorStoreIds.includes(sid)
  );

  if (!relevantStoreIds || relevantStoreIds.length === 0)
    return { success: false, error: "No order items for this vendor" };

  // Save vendor response in history
  const entries = relevantStoreIds.map((storeId) => ({
    orderId,
    orderNumber: order.orderNumber || null,
    storeId,
    status: accept
      ? ORDER_CONSTANTS.VENDOR_ACCEPTED
      : ORDER_CONSTANTS.VENDOR_REJECTED,
    note,
    changedBy: vendorId,
    actorRole: ORDER_HISTORY_CONSTANTS.VENDOR,
    timestamp: formatDate(new Date()),
  }));

  await OrderHistory.insertMany(entries);

  // If rejected by ANY vendor store → cancel full order
  const [anyRejected, acceptedDocs] = await Promise.all([
    OrderHistory.exists({
      orderId,
      status: ORDER_CONSTANTS.VENDOR_REJECTED,
    }),
    OrderHistory.find({
      orderId,
      status: ORDER_CONSTANTS.VENDOR_ACCEPTED,
    }).lean(),
  ]);

  if (anyRejected) {
    await Order.findByIdAndUpdate(
      orderId,
      { $set: { status: ORDER_CONSTANTS.CANCELLED } },
      { new: true }
    );
  } else {
    // Check if all stores accepted
    const acceptedStoreSet = new Set(
      acceptedDocs.map((d) => String(d.storeId))
    );
    const allAccepted = orderStoreIds.every((sid) => acceptedStoreSet.has(sid));

    if (allAccepted) {
      await Order.findByIdAndUpdate(
        orderId,
        { $set: { status: ORDER_CONSTANTS.PROCESSING } },
        { new: true }
      );
    }
  }

  // 🔥🔥🔥 DELIVERY PARTNER ASSIGNMENT HERE
  if (accept) {
    const firstVendorStore = relevantStoreIds[0];

    const assignedDp = await assignDeliveryPartner(orderId, firstVendorStore);

    if (!assignedDp) {
      logger.warn("⚠ No delivery partner found in radius");
    } else {
      logger.info("🚚 Delivery Partner Assigned:", assignedDp._id);
    }
  }

  const [updatedOrder, history] = await Promise.all([
    Order.findById(orderId).lean(),
    OrderHistory.find({
      orderId,
      storeId: { $in: vendorStoreIds },
    })
      .sort({ timestamp: 1 })
      .lean(),
  ]);

  updatedOrder.history = history;

  return { success: true, data: updatedOrder };
};

const getOrdersForVendor = async (vendorId, { limit = 50, skip = 0 } = {}) => {
  if (!vendorId) return { success: false, error: "Vendor id required" };
  const stores = await Store.find({ vendorId }).select("_id").lean();

  const storeIds = stores.map((s) => s._id);
  const orders = await Order.find({ "items.storeId": { $in: storeIds } })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  // Batch fetch all order histories at once instead of in a loop
  if (orders.length > 0) {
    const orderIds = orders.map((o) => o._id);
    const allHistories = await OrderHistory.find({
      orderId: { $in: orderIds },
      storeId: { $in: storeIds },
    })
      .sort({ orderId: 1, timestamp: 1 })
      .lean();

    // Group histories by orderId
    const historyMap = new Map();
    for (const hist of allHistories) {
      const orderIdStr = String(hist.orderId);
      if (!historyMap.has(orderIdStr)) {
        historyMap.set(orderIdStr, []);
      }
      historyMap.get(orderIdStr).push(hist);
    }

    // Assign histories to orders
    for (const o of orders) {
      o.history = historyMap.get(String(o._id)) || [];
    }
  }
  return { success: true, data: orders };
};

const getVendorOrderById = async (vendorId, orderId) => {
  if (!vendorId) return { success: false, error: "Vendor id required" };
  if (!orderId || !mongoose.Types.ObjectId.isValid(orderId))
    return { success: false, error: "Valid orderId required" };

  const order = await Order.findById(orderId).lean();
  if (!order) return { success: false, notFound: true };

  const stores = await Store.find({ vendorId }).select("_id").lean();
  const storeIds = stores.map((s) => String(s._id));
  const orderStoreIds = Array.from(
    new Set(order.items.map((i) => String(i.storeId)))
  );

  const relevant = orderStoreIds.some((sid) => storeIds.includes(sid));
  if (!relevant)
    return { success: false, error: "Not authorized for this order" };

  const history = await OrderHistory.find({
    orderId,
    storeId: { $in: storeIds },
  })
    .sort({ timestamp: 1 })
    .lean();
  order.history = history;
  return { success: true, data: order };
};

const getOrdersForAdminByVendor = async (
  vendorId,
  { limit = 50, skip = 0 } = {}
) => {
  if (!vendorId) return { success: false, error: "Vendor id required" };
  const stores = await Store.find({ vendorId }).select("_id").lean();
  const storeIds = stores.map((s) => s._id);

  const orders = await Order.find({ "items.storeId": { $in: storeIds } })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  // Batch fetch all order histories at once instead of in a loop
  if (orders.length > 0) {
    const orderIds = orders.map((o) => o._id);
    const allHistories = await OrderHistory.find({
      orderId: { $in: orderIds },
    })
      .sort({ orderId: 1, timestamp: 1 })
      .lean();

    // Group histories by orderId
    const historyMap = new Map();
    for (const hist of allHistories) {
      const orderIdStr = String(hist.orderId);
      if (!historyMap.has(orderIdStr)) {
        historyMap.set(orderIdStr, []);
      }
      historyMap.get(orderIdStr).push(hist);
    }

    // Assign histories to orders
    for (const o of orders) {
      o.history = historyMap.get(String(o._id)) || [];
    }
  }
  return { success: true, data: orders };
};

const updateDeliveryPartnerEarnings = async (orderId, deliveryPartnerId) => {
  if (!orderId || !mongoose.Types.ObjectId.isValid(orderId))
    return { success: false, error: "Valid orderId required" };
  if (!deliveryPartnerId || !mongoose.Types.ObjectId.isValid(deliveryPartnerId))
    return { success: false, error: "Valid deliveryPartnerId required" };

  try {
    const order = await Order.findById(orderId).lean();
    if (!order) return { success: false, notFound: true };

    // Get current earnings
    const currentEarnings = order.deliveryPartnerEarnings || {
      baseFee: 0,
      incentive: 0,
      tip: order.tip || 0,
      total: 0,
    };

    // Calculate incentive based on daily order count
    const dailyOrderCount = await getDeliveryPartnerDailyOrderCount(
      deliveryPartnerId
    );
    const incentive = calculateDeliveryPartnerIncentive(dailyOrderCount);

    // Calculate total earnings
    const totalEarnings = parseFloat(
      (
        currentEarnings.baseFee +
        incentive +
        (currentEarnings.tip || order.tip || 0)
      ).toFixed(2)
    );

    // Update order with delivery partner ID and earnings
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        $set: {
          deliveryPartnerId,
          tip: currentEarnings.tip || order.tip || 0,
          "deliveryPartnerEarnings.baseFee": currentEarnings.baseFee,
          "deliveryPartnerEarnings.incentive": incentive,
          "deliveryPartnerEarnings.tip": currentEarnings.tip || order.tip || 0,
          "deliveryPartnerEarnings.total": totalEarnings,
        },
      },
      { new: true }
    ).lean();

    if (!updatedOrder) return { success: false, notFound: true };

    return { success: true, data: updatedOrder };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * Update tip amount for an order
 * @param {ObjectId} orderId - Order ID
 * @param {Number} tipAmount - Tip amount in ₹
 * @returns {Promise<Object>} - Updated order or error
 */
const updateOrderTip = async (orderId, tipAmount) => {
  if (!orderId || !mongoose.Types.ObjectId.isValid(orderId))
    return { success: false, error: "Valid orderId required" };
  if (typeof tipAmount !== "number" || tipAmount < 0)
    return { success: false, error: "Valid tipAmount required" };

  try {
    const order = await Order.findById(orderId).lean();
    if (!order) return { success: false, notFound: true };

    const currentEarnings = order.deliveryPartnerEarnings || {
      baseFee: 0,
      incentive: 0,
      tip: 0,
      total: 0,
    };

    const newTip = parseFloat(tipAmount.toFixed(2));
    const totalEarnings = parseFloat(
      (currentEarnings.baseFee + currentEarnings.incentive + newTip).toFixed(2)
    );

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        $set: {
          tip: newTip,
          "deliveryPartnerEarnings.tip": newTip,
          "deliveryPartnerEarnings.total": totalEarnings,
        },
      },
      { new: true }
    ).lean();

    if (!updatedOrder) return { success: false, notFound: true };

    return { success: true, data: updatedOrder };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

module.exports = {
  createOrderFromCart,
  getOrdersForUser,
  getOrderById,
  addOrderHistory,
  updatePaymentStatus,
  getOrderHistory,
  /* vendor/admin helpers */
  vendorRespondToOrder,
  getOrdersForVendor,
  getVendorOrderById,
  getOrdersForAdminByVendor,
  /* delivery partner helpers */
  updateDeliveryPartnerEarnings,
  updateOrderTip,
  getDeliveryPartnerDailyOrderCount,
  calculateDeliveryPartnerBaseFee,
  calculateDeliveryPartnerIncentive,
};
