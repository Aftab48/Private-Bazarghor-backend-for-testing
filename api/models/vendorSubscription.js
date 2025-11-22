const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { PLAN_STATUS } = require("../../config/constants/planConstant");

const VendorSubscriptionSchema = new Schema(
  {
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    storeId: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      required: false,
      index: true,
    },
    planName: { type: String, required: true },
    monthlyFee: { type: Number, required: true },
    commissionPercent: { type: Number, required: true },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    autoRenew: { type: Boolean, default: false },
    isFreeTrial: { type: Boolean, default: false },
    status: {
      type: String,
      enum: [
        PLAN_STATUS.ACTIVE,
        PLAN_STATUS.PAUSED,
        PLAN_STATUS.CANCELLED,
        PLAN_STATUS.EXPIRED,
      ],
      default: "active",
    },
    paymentReference: { type: String },
    updatedBy: [
      {
        type: Schema.Types.ObjectId,
      },
    ],
    deletedBy: {
      type: Schema.Types.ObjectId,
    },
  },

  { timestamps: true }
);

module.exports = mongoose.model("Subscription", VendorSubscriptionSchema);
