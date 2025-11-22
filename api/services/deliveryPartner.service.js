const User = require("../models/user");
const DeliveryHistory = require("../models/deliveryHistory");
const Order = require("../models/order");
const Store = require("../models/store");
const { ROLE } = require("../../config/constants/authConstant");
const { DELIVERY_PTR } = require("../../config/constants/deliveryConstant");
const { formatDate } = require("../helpers/utils/date");

const findNearbyDeliveryPartner = async (storeLocation) => {
  const radiusKm = 5;

  const partners = await User.find({
    "roles.code": ROLE.DELIVERY_PARTNER,
    "deliveryPartner.isAvailable": true,
    "deliveryPartner.lastLocation": { $exists: true },
  }).lean();

  if (!partners.length) return null;

  const toRad = (v) => (v * Math.PI) / 180;
  const distKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  let nearest = null;
  let minDistance = Infinity;

  for (const p of partners) {
    const d = distKm(
      storeLocation.lat,
      storeLocation.lng,
      p.deliveryPartner.lastLocation.lat,
      p.deliveryPartner.lastLocation.lng
    );

    if (d <= radiusKm && d < minDistance) {
      nearest = p;
      minDistance = d;
    }
  }

  return nearest;
};

const assignDeliveryPartner = async (orderId, storeId) => {
  const store = await Store.findById(storeId).lean();
  if (!store || !store.location) return null;

  const dp = await findNearbyDeliveryPartner(store.location);
  if (!dp) return null;

  await Order.findByIdAndUpdate(orderId, {
    $set: {
      deliveryPartnerId: dp._id,
      status: DELIVERY_PTR.ASSIGNED_TO_PARTNER,
    },
  });

  await DeliveryHistory.create({
    deliveryPartnerId: dp._id,
    orderId,
    status: DELIVERY_PTR.ASSIGNED,
    locationAtEvent: dp.deliveryPartner.lastLocation,
  });

  return dp;
};

const dpRespondToOrder = async (dpId, orderId, accept) => {
  const order = await Order.findById(orderId);
  //   console.log("order.deliveryPartnerId: ", order.deliveryPartnerId);
  if (!order || order.deliveryPartnerId !== dpId) {
    console.log("order.deliveryPartnerId: ", order.deliveryPartnerId);
    // console.log("order: ", order);
    // console.log("dpId: ", dpId);
    return { success: false, error: "Order not assigned to this partner" };
  }

  await DeliveryHistory.create({
    deliveryPartnerId: dpId,
    orderId,
    status: accept ? DELIVERY_PTR.ACCEPTED : DELIVERY_PTR.REJECTED,
    timestamp: formatDate(new Date()),
  });

  if (!accept) {
    order.deliveryPartnerId = null;
    order.status = DELIVERY_PTR.PENDING_REASSIGN;
    await order.save();
    return { success: true, message: "Order rejected" };
  }

  order.status = DELIVERY_PTR.PARTNER_ACCEPTED;
  await order.save();

  return { success: true, message: "Order accepted", data: order };
};

const dpPickup = async (dpId, orderId) => {
  await DeliveryHistory.create({
    deliveryPartnerId: dpId,
    orderId,
    status: DELIVERY_PTR.PICKED_FROM_STORE,
  });

  await Order.findByIdAndUpdate(orderId, {
    $set: { status: DELIVERY_PTR.PICKED_FROM_STORE },
  });

  return { success: true, message: "Order picked up" };
};

const dpDeliver = async (dpId, orderId, rating = null) => {
  await DeliveryHistory.create({
    deliveryPartnerId: dpId,
    orderId,
    status: DELIVERY_PTR.DELIVERED,
    rating,
  });

  const order = await Order.findByIdAndUpdate(
    orderId,
    { $set: { status: DELIVERY_PTR.DELIVERED } },
    { new: true }
  );

  await User.findByIdAndUpdate(dpId, {
    $inc: { "deliveryPartner.totalDeliveries": 1 },
  });

  return { success: true, data: order };
};

const getDpStats = async (dpId) => {
  const total = await DeliveryHistory.countDocuments({
    deliveryPartnerId: dpId,
    status: DELIVERY_PTR.DELIVERED,
  });

  const deliveries = await DeliveryHistory.find({
    deliveryPartnerId: dpId,
    status: DELIVERY_PTR.DELIVERED,
  })
    .populate("orderId")
    .sort({ timestamp: -1 });

  const avgRating =
    (
      await DeliveryHistory.aggregate([
        { $match: { deliveryPartnerId: dpId, rating: { $ne: null } } },
        { $group: { _id: null, avg: { $avg: "$rating" } } },
      ])
    )[0]?.avg || 5;

  return { success: true, total, avgRating, deliveries };
};

module.exports = {
  findNearbyDeliveryPartner,
  assignDeliveryPartner,
  dpRespondToOrder,
  dpPickup,
  dpDeliver,
  getDpStats,
};
