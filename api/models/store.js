const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { fileSchema } = require("../helpers/utils/commonSchema");
const mongoosePaginate = require("mongoose-paginate-v2");
const { PLANS } = require("../../config/constants/planConstant");

const schema = new Schema(
  {
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    products: [
      {
        type: Schema.Types.ObjectId,
        ref: "Product",
      },
    ],

    storeCode: {
      type: String,
      unique: true,
      index: true,
    },

    storeName: { type: String },
    storeAddress: { type: String },
    storePictures: { type: [fileSchema], default: [] },
    // geo location for delivery distance calculations
    location: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },

    // subscription plan for the vendor: Basic | Standard | Premium
    subscriptions: [
      {
        subscriptionPlan: {
          type: String,
          enum: [PLANS.BASIC, PLANS.STANDARD, PLANS.PREMIUM],
        },
        subscriptionExpiresAt: { type: Date },
        subscriptionId: {
          type: Schema.Types.ObjectId,
          ref: "VendorSubscription",
        },
        commissionPercent: { type: Number },
      },
    ],
    workingDays: {
      type: [String],
      default: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
    },
    updatedBy: [
      {
        type: Schema.Types.ObjectId,
      },
    ],
    deletedBy: {
      type: Schema.Types.ObjectId,
    },
    contactNumber: { type: String },
    email: { type: String },
    description: { type: String },

    category: { type: String, default: "Grocery" },
    deliveryAvailable: { type: Boolean, default: true },
    deliveryRadius: { type: Number, default: 15 },
    minOrderValue: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },

    isApproved: { type: Boolean, default: false },
    storeStatus: { type: Number },
    isStoreOpen: { type: Boolean, default: true },
  },
  { timestamps: true }
);

schema.pre("save", async function (next) {
  if (this.isNew) {
    const lastStore = await mongoose
      .model("Store")
      .findOne({}, {}, { sort: { createdAt: -1 } });
    let newCode = "STR0001";
    if (lastStore && lastStore.storeCode) {
      const lastNumber = parseInt(lastStore.storeCode.replace("STR", ""));
      newCode = `STR${String(lastNumber + 1).padStart(4, "0")}`;
    }
    this.storeCode = newCode;
  }
  next();
});

schema.plugin(mongoosePaginate);

const store = mongoose.model("Store", schema, "stores");
module.exports = store;
