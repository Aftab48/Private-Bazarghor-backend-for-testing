const Product = require("../models/product");
const Store = require("../models/storeModel");
const User = require("../models/user");
const FileService = require("./file.service");
const { catchAsync } = require("../helpers/utils/catchAsync");
const messages = require("../helpers/utils/messages");
const logger = require("../helpers/utils/logger");
const { PRODUCT_STATUS } = require("../../config/constants/productConstant");
const mongoose = require("mongoose");

// Helper function to build query condition for ID or slug
const buildProductQuery = (id) => {
  const isObjectId = mongoose.Types.ObjectId.isValid(id) && id.length === 24;
  return isObjectId ? { _id: id } : { slug: id };
};

// Create Product
const createProduct = async (req) => {
  const { productName, productDescription, quantity, price, category, subcategory, storeId } = req.body;
  const userId = req.user;

  if (!userId) {
    FileService.deleteUploadedFiles(req.files);
    return { success: false, error: "User not authenticated" };
  }

  // Verify store belongs to vendor
  const store = await Store.findOne({ _id: storeId, vendorId: userId, deletedAt: null });
  if (!store) {
    FileService.deleteUploadedFiles(req.files);
    return { success: false, error: "Store not found or access denied" };
  }

  // Handle product images
  const productImages = [];
  if (req.files?.productImages?.length) {
    req.files.productImages.forEach((f) => {
      productImages.push(FileService.generateFileObject(f));
    });
  }

  // Determine status based on quantity
  let status = PRODUCT_STATUS.IN_STOCK;
  if (quantity === 0) {
    status = PRODUCT_STATUS.OUT_OF_STOCK;
  } else if (quantity < 10) {
    status = PRODUCT_STATUS.LOW_STOCK;
  }

  const productData = {
    vendorId: userId,
    storeId: storeId,
    productName,
    productDescription: productDescription || "",
    productImages,
    quantity,
    price,
    category,
    subcategory: subcategory || null,
    status,
    isActive: true,
    createdBy: userId,
  };

  try {
    const product = await Product.create(productData);
    return {
      success: true,
      data: product,
    };
  } catch (err) {
    FileService.deleteUploadedFiles(req.files);
    logger.error("Product creation error:", err);
    return { success: false, error: err.message };
  }
};

// Get Products (with pagination and filters)
const getProducts = async (req) => {
  const userId = req.user;
  const {
    page = 1,
    limit = 10,
    category,
    subcategory,
    status,
    search,
    storeId,
  } = req.query;

  const query = {
    deletedAt: null,
  };

  // If vendor, only show their products
  if (userId) {
    query.vendorId = userId;
  }

  // Apply filters
  if (storeId) {
    query.storeId = storeId;
  }
  if (category) {
    query.category = category;
  }
  if (subcategory) {
    query.subcategory = subcategory;
  }
  if (status) {
    query.status = status;
  }

  // Text search
  if (search) {
    query.$or = [
      { productName: { $regex: search, $options: "i" } },
      { productDescription: { $regex: search, $options: "i" } },
    ];
  }

  try {
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: [
        { path: "vendorId", select: "firstName lastName email mobNo" },
        { path: "storeId", select: "storeName storeCode" },
        { path: "createdBy", select: "firstName lastName" },
      ],
    };

    const products = await Product.paginate(query, options);
    return {
      success: true,
      data: products,
    };
  } catch (err) {
    logger.error("Get products error:", err);
    return { success: false, error: err.message };
  }
};

// Get Product By ID or Slug
const getProductById = async (req) => {
  const { id } = req.params;
  const userId = req.user;

  const query = {
    ...buildProductQuery(id),
    deletedAt: null,
  };

  // If vendor, ensure they own the product
  if (userId) {
    query.vendorId = userId;
  }

  try {
    const product = await Product.findOne(query)
      .populate("vendorId", "firstName lastName email mobNo")
      .populate("storeId", "storeName storeCode")
      .populate("createdBy", "firstName lastName")
      .populate("updatedBy", "firstName lastName");

    if (!product) {
      return { success: false, notFound: true };
    }

    return {
      success: true,
      data: product,
    };
  } catch (err) {
    logger.error("Get product by ID error:", err);
    return { success: false, error: err.message };
  }
};

// Update Product
const updateProduct = async (req) => {
  const { id } = req.params;
  const userId = req.user;
  const { productName, productDescription, quantity, price, category, subcategory, status } = req.body;

  if (!userId) {
    FileService.deleteUploadedFiles(req.files);
    return { success: false, error: "User not authenticated" };
  }

  // Find product and verify ownership
  const product = await Product.findOne({
    ...buildProductQuery(id),
    vendorId: userId,
    deletedAt: null,
  });

  if (!product) {
    FileService.deleteUploadedFiles(req.files);
    return { success: false, notFound: true };
  }

  // Handle product images update
  let productImages = product.productImages || [];
  if (req.files?.productImages?.length) {
    // Delete old images if needed (optional - you can keep them or remove)
    const newImages = req.files.productImages.map((f) => FileService.generateFileObject(f));
    productImages = [...productImages, ...newImages];
  }

  // Build update object
  const updateData = {
    updatedBy: userId,
  };

  if (productName !== undefined) updateData.productName = productName;
  if (productDescription !== undefined) updateData.productDescription = productDescription;
  if (quantity !== undefined) updateData.quantity = quantity;
  if (price !== undefined) updateData.price = price;
  if (category !== undefined) updateData.category = category;
  if (subcategory !== undefined) updateData.subcategory = subcategory || null;
  if (status !== undefined) updateData.status = status;
  if (productImages.length > 0) updateData.productImages = productImages;

  // Auto-update status based on quantity if quantity is being updated
  if (quantity !== undefined) {
    if (quantity === 0) {
      updateData.status = PRODUCT_STATUS.OUT_OF_STOCK;
    } else if (quantity < 10) {
      updateData.status = PRODUCT_STATUS.LOW_STOCK;
    } else {
      updateData.status = PRODUCT_STATUS.IN_STOCK;
    }
  }

  try {
    const updatedProduct = await Product.findOneAndUpdate(
      { ...buildProductQuery(id) },
      updateData,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("vendorId", "firstName lastName email mobNo")
      .populate("storeId", "storeName storeCode")
      .populate("updatedBy", "firstName lastName");

    return {
      success: true,
      data: updatedProduct,
    };
  } catch (err) {
    FileService.deleteUploadedFiles(req.files);
    logger.error("Product update error:", err);
    return { success: false, error: err.message };
  }
};

// Delete Product (Soft Delete)
const deleteProduct = async (req) => {
  const { id } = req.params;
  const userId = req.user;

  if (!userId) {
    return { success: false, error: "User not authenticated" };
  }

  const product = await Product.findOne({
    ...buildProductQuery(id),
    vendorId: userId,
    deletedAt: null,
  });

  if (!product) {
    return { success: false, notFound: true };
  }

  try {
    const deletedProduct = await Product.findOneAndUpdate(
      { ...buildProductQuery(id) },
      {
        deletedAt: new Date(),
        deletedBy: userId,
        isActive: false,
      },
      { new: true }
    );

    return {
      success: true,
      data: deletedProduct,
    };
  } catch (err) {
    logger.error("Product delete error:", err);
    return { success: false, error: err.message };
  }
};

// Get Categories and Subcategories
const getCategories = async () => {
  const { PRODUCT_CATEGORIES, PRODUCT_SUBCATEGORIES } = require("../../config/constants/productConstant");
  
  return {
    success: true,
    data: {
      categories: PRODUCT_CATEGORIES,
      subcategories: PRODUCT_SUBCATEGORIES,
    },
  };
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getCategories,
};

