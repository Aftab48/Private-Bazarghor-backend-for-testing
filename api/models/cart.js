const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { CART_CONSTANTS } = require("../../config/constants/cartConstant");

const CartItemSchema = new Schema(
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
    productName: { type: String },
    productImage: { type: Object },
  },
  { _id: false }
);

const CartSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: { type: [CartItemSchema], default: [] },
    status: {
      type: String,
      enum: Object.values(CART_CONSTANTS),
      default: CART_CONSTANTS.ACTIVE,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Cart", CartSchema);
