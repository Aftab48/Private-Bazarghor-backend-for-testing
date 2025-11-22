const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { DELIVERY_PTR } = require("../../config/constants/deliveryConstant");
const deliveryHistorySchema = new Schema(
  {
    deliveryPartnerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },

    status: {
      type: String,
      enum: [
        DELIVERY_PTR.ACCEPTED,
        DELIVERY_PTR.ASSIGNED,
        DELIVERY_PTR.CANCELLED,
        DELIVERY_PTR.PICKED_FROM_STORE,
        DELIVERY_PTR.DELIVERED,
        DELIVERY_PTR.REJECTED,
      ],
      required: true,
    },

    note: String,
    rating: { type: Number, min: 1, max: 5, default: null },
    locationAtEvent: {
      lat: Number,
      lng: Number,
    },

    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DeliveryHistory", deliveryHistorySchema);
