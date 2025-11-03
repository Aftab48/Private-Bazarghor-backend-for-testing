const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { fileSchema } = require("../helpers/utils/commonSchema");
const mongoosePaginate = require("mongoose-paginate-v2");
// var idValidator = require("mongoose-id-validator");

const schema = new Schema(
  {
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    storeCode: {
      type: String,
      unique: true,
      index: true,
    },

    storeName: { type: String },
    storeAddress: { type: String },
    storePictures: { type: [fileSchema], default: [] },

    openingTime: { type: String },
    closingTime: { type: String },
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
    contactNumber: { type: String },
    email: { type: String },
    description: { type: String },

    category: { type: String, default: "Grocery" },
    deliveryAvailable: { type: Boolean, default: true },
    deliveryRadius: { type: Number, default: 5 },
    minOrderValue: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },

    isApproved: { type: Boolean, default: false },
    storeStatus: { type: Number },
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
// schema.plugin(idValidator);

const store = mongoose.model("Store", schema, "stores");
module.exports = store;
