const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { fileSchema } = require("../helpers/utils/commonSchema");
const mongoosePaginate = require("mongoose-paginate-v2");
const { PRODUCT_STATUS, CATEGORIES_LIST, SUBCATEGORIES_LIST } = require("../../config/constants/productConstant");
const { generateSlug, generateUniqueSlug } = require("../helpers/utils/slug");

const myCustomLabels = {
  totalDocs: "itemCount",
  docs: "data",
  limit: "perPage",
  page: "currentPage",
  nextPage: "next",
  prevPage: "prev",
  totalPages: "pageCount",
  pagingCounter: "slNo",
  meta: "paginator",
};

const schema = new Schema(
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
      required: true,
      index: true,
    },
    productName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      unique: true,
      index: true,
      sparse: true,
    },
    productDescription: {
      type: String,
      default: "",
    },
    productImages: {
      type: [fileSchema],
      default: [],
    },
    quantity: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      required: true,
      enum: CATEGORIES_LIST,
      index: true,
    },
    subcategory: {
      type: String,
      enum: SUBCATEGORIES_LIST,
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(PRODUCT_STATUS),
      default: PRODUCT_STATUS.IN_STOCK,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    deletedAt: {
      type: Date,
      index: true,
    },
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Generate and update slug when productName changes
schema.pre("save", async function (next) {
  try {
    // Generate slug if productName is modified or slug doesn't exist
    if (this.isModified("productName") || !this.slug) {
      const baseSlug = generateSlug(this.productName);
      
      // Check if slug exists (excluding current document for updates)
      const checkExists = async (slug, excludeId) => {
        const query = { slug, deletedAt: null };
        if (excludeId) {
          query._id = { $ne: excludeId };
        }
        const existing = await mongoose.model("Product").findOne(query);
        return !!existing;
      };
      
      this.slug = await generateUniqueSlug(baseSlug, checkExists, this._id);
    }
    
    // Update status based on quantity
    if (this.isModified("quantity")) {
      if (this.quantity === 0) {
        this.status = PRODUCT_STATUS.OUT_OF_STOCK;
      } else if (this.quantity < 10) {
        this.status = PRODUCT_STATUS.LOW_STOCK;
      } else {
        this.status = PRODUCT_STATUS.IN_STOCK;
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Index for search functionality
schema.index({ productName: "text", productDescription: "text" });

schema.plugin(mongoosePaginate);

const Product = mongoose.model("Product", schema);

module.exports = Product;

