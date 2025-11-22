const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const mongoosePaginate = require("mongoose-paginate-v2");
const {
  ORDER_HISTORY_CONSTANTS,
} = require("../../config/constants/orderConstant");

const OrderHistorySchema = new Schema(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    orderNumber: { type: String, index: true, default: null },
    storeId: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      default: null,
    },
    status: { type: String, required: true },
    note: { type: String, default: null },
    changedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    actorRole: {
      type: String,
      enum: Object.values(ORDER_HISTORY_CONSTANTS),
      default: ORDER_HISTORY_CONSTANTS.SYSTEM,
    },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

OrderHistorySchema.plugin(mongoosePaginate);

module.exports = mongoose.model("OrderHistory", OrderHistorySchema);
