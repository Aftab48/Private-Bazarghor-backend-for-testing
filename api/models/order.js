const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { fileSchema } = require("../helpers/utils/commonSchema");
const mongoosePaginate = require("mongoose-paginate-v2");
const { ORDER_CONSTANTS } = require("../../config/constants/orderConstant");

const OrderItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    storeId: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
    productName: { type: String },
    productImage: { type: [fileSchema], default: null },
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    items: { type: [OrderItemSchema], default: [] },
    subtotal: { type: Number, required: true, default: 0 },
    tax: { type: Number, required: true, default: 0 },
    shipping: { type: Number, required: true, default: 0 },
    totalAmount: { type: Number, required: true, default: 0 },
    address: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
      phone: String,
    },
    status: {
      type: String,
      enum: Object.values(ORDER_CONSTANTS),
      default: ORDER_CONSTANTS.CREATED,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    // delivery partner assignment
    deliveryPartnerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // overall order distance in km (for tracking)
    distanceKm: { type: Number, default: null },
    // human-friendly unique order number
    orderNumber: { type: String, unique: true, index: true },
    // customer tip for delivery partner
    tip: { type: Number, default: 0 },
    // breakdown per store for revenue sharing and accounting
    storeBreakdown: {
      type: [
        {
          storeId: { type: Schema.Types.ObjectId, ref: "Store" },
          subtotal: { type: Number, default: 0 },
          tax: { type: Number, default: 0 },
          shipping: { type: Number, default: 0 },
          total: { type: Number, default: 0 },
          distanceKm: { type: Number, default: null },
          commissionPercent: { type: Number, default: 0 },
          commissionAmount: { type: Number, default: 0 },
          vendorShare: { type: Number, default: 0 },
          platformShare: { type: Number, default: 0 },
        },
      ],
      default: [],
    },
    // aggregated financials
    commissionTotal: { type: Number, default: 0 },
    vendorTotal: { type: Number, default: 0 },
    platformTotal: { type: Number, default: 0 },
    // delivery charge totals and who paid what
    deliveryCharge: { type: Number, default: 0 },
    deliveryChargeCustomer: { type: Number, default: 0 },
    deliveryChargeVendor: { type: Number, default: 0 },
    deliveryChargePlatform: { type: Number, default: 0 },
    // platform rewards/cashback granted for this order
    platformRewards: {
      cashback: { type: Number, default: 0 },
    },
    // delivery partner earnings breakdown
    deliveryPartnerEarnings: {
      baseFee: { type: Number, default: 0 },
      incentive: { type: Number, default: 0 },
      tip: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

OrderSchema.plugin(mongoosePaginate);

module.exports = mongoose.model("Order", OrderSchema);
