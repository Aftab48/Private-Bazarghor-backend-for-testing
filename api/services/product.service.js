const Product = require("../models/product");
const Store = require("../models/store");
const User = require("../models/user");
const FileService = require("./file.service");
const logger = require("../helpers/utils/logger");
const { PRODUCT_STATUS } = require("../../config/constants/productConstant");
const mongoose = require("mongoose");

const buildProductQuery = (id) => {
  const isObjectId = mongoose.Types.ObjectId.isValid(id) && id.length === 24;
  return isObjectId ? { _id: id } : { slug: id };
};

const createProduct = async (req) => {
  const {
    productName,
    productDescription,
    quantity,
    price,
    category,
    subcategory,
    storeId,
  } = req.body;
  const userId = req.user;

  if (!userId) {
    FileService.deleteUploadedFiles(req.files);
    return { success: false, error: "User not authenticated" };
  }

  let selectedStoreId = storeId;
  if (!selectedStoreId) {
    const user = await User.findById(userId).lean();
    selectedStoreId = user?.storeDetails || null;
  }

  if (!selectedStoreId) {
    FileService.deleteUploadedFiles(req.files);
    return {
      success: false,
      error: "Store not provided and vendor has no store",
    };
  }

  const store = await Store.findOne({
    _id: selectedStoreId,
    vendorId: userId,
    deletedAt: null,
  });
  if (!store) {
    FileService.deleteUploadedFiles(req.files);
    return { success: false, error: "Store not found or access denied" };
  }

  const productImages = [];
  if (req.files?.productImages?.length) {
    req.files.productImages.forEach((f) => {
      productImages.push(FileService.generateFileObject(f));
    });
  }

  let status = PRODUCT_STATUS.IN_STOCK;
  if (quantity === 0) {
    status = PRODUCT_STATUS.OUT_OF_STOCK;
  } else if (quantity < 10) {
    status = PRODUCT_STATUS.LOW_STOCK;
  }

  const productData = {
    vendorId: userId,
    storeId: selectedStoreId,
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
    await Store.findByIdAndUpdate(selectedStoreId, {
      $push: { products: product._id },
    });
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

  if (userId) {
    query.vendorId = userId;
  }

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

const getProductsForStore = async (req) => {
  const {
    page = 1,
    limit = 10,
    category,
    subcategory,
    status,
    search,
  } = req.query;
  const { storeId } = req.params;

  if (!storeId) return { success: false, error: "storeId required" };

  const query = { deletedAt: null, storeId };

  if (category) query.category = category;
  if (subcategory) query.subcategory = subcategory;
  if (status) query.status = status;

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
        { path: "vendorId", select: "firstName lastName" },
        { path: "storeId", select: "storeName storeCode" },
      ],
      lean: true,
    };

    const products = await Product.paginate(query, options);
    return { success: true, data: products };
  } catch (err) {
    logger.error("Get products for store error:", err);
    return { success: false, error: err.message };
  }
};

const getProductById = async (req) => {
  const { id } = req.params;
  const userId = req.user;

  const query = {
    ...buildProductQuery(id),
    deletedAt: null,
  };

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

const updateProduct = async (req) => {
  const { id } = req.params;
  const userId = req.user;
  const {
    productName,
    productDescription,
    quantity,
    price,
    category,
    subcategory,
    status,
  } = req.body;

  if (!userId) {
    FileService.deleteUploadedFiles(req.files);
    return { success: false, error: "User not authenticated" };
  }

  const product = await Product.findOne({
    ...buildProductQuery(id),
    vendorId: userId,
    deletedAt: null,
  });

  if (!product) {
    FileService.deleteUploadedFiles(req.files);
    return { success: false, notFound: true };
  }

  let productImages = product.productImages || [];
  if (req.files?.productImages?.length) {
    const newImages = req.files.productImages.map((f) =>
      FileService.generateFileObject(f)
    );
    productImages = [...productImages, ...newImages];
  }

  const updateData = {
    updatedBy: userId,
  };

  if (productName !== undefined) updateData.productName = productName;
  if (productDescription !== undefined)
    updateData.productDescription = productDescription;
  if (quantity !== undefined) updateData.quantity = quantity;
  if (price !== undefined) updateData.price = price;
  if (category !== undefined) updateData.category = category;
  if (subcategory !== undefined) updateData.subcategory = subcategory || null;
  if (status !== undefined) updateData.status = status;
  if (productImages.length > 0) updateData.productImages = productImages;

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

    try {
      if (deletedProduct?.storeId) {
        await Store.findByIdAndUpdate(deletedProduct.storeId, {
          $pull: { products: deletedProduct._id },
        });
      }
    } catch (e) {
      logger.error(
        "Product delete: failed to remove product from store.products",
        e
      );
    }

    return {
      success: true,
      data: deletedProduct,
    };
  } catch (err) {
    logger.error("Product delete error:", err);
    return { success: false, error: err.message };
  }
};

const getCategories = async () => {
  const {
    PRODUCT_CATEGORIES,
    PRODUCT_SUBCATEGORIES,
  } = require("../../config/constants/productConstant");

  return {
    success: true,
    data: {
      categories: PRODUCT_CATEGORIES,
      subcategories: PRODUCT_SUBCATEGORIES,
    },
  };
};

const createProductByAdmin = async (req) => {
  const {
    vendorId,
    storeId,
    productName,
    productDescription,
    quantity,
    price,
    category,
    subcategory,
  } = req.body;

  if (!vendorId || !storeId) {
    FileService.deleteUploadedFiles(req.files);
    return { success: false, error: "vendorId and storeId are required" };
  }

  const store = await Store.findOne({ _id: storeId, deletedAt: null });
  if (!store) {
    FileService.deleteUploadedFiles(req.files);
    return { success: false, error: "Store not found" };
  }

  const productImages = [];
  if (req.files?.productImages?.length) {
    req.files.productImages.forEach((f) =>
      productImages.push(FileService.generateFileObject(f))
    );
  }

  let status = PRODUCT_STATUS.IN_STOCK;
  if (quantity === 0) status = PRODUCT_STATUS.OUT_OF_STOCK;
  else if (quantity < 10) status = PRODUCT_STATUS.LOW_STOCK;

  const productData = {
    vendorId,
    storeId,
    productName,
    productDescription: productDescription || "",
    productImages,
    quantity,
    price,
    category,
    subcategory: subcategory || null,
    status,
    isActive: true,
    createdBy: req.admin,
  };

  try {
    const product = await Product.create(productData);
    await Store.findByIdAndUpdate(storeId, {
      $push: { products: product._id },
    });
    return { success: true, data: product };
  } catch (err) {
    FileService.deleteUploadedFiles(req.files);
    logger.error("Admin: Product creation error:", err);
    return { success: false, error: err.message };
  }
};

const getProductsByAdmin = async (req) => {
  const {
    page = 1,
    limit = 10,
    category,
    subcategory,
    status,
    search,
    vendorId,
    storeId,
  } = req.query;

  const query = { deletedAt: null };

  if (vendorId) query.vendorId = vendorId;
  if (storeId) query.storeId = storeId;
  if (category) query.category = category;
  if (subcategory) query.subcategory = subcategory;
  if (status) query.status = status;

  if (search) {
    query.$or = [
      { productName: { $regex: search, $options: "i" } },
      { productDescription: { $regex: search, $options: "i" } },
    ];
  }

  try {
    const products = await Product.paginate(query, {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: [
        { path: "vendorId", select: "firstName lastName email mobNo" },
        { path: "storeId", select: "storeName storeCode" },
        { path: "createdBy", select: "firstName lastName" },
      ],
    });

    return { success: true, data: products };
  } catch (err) {
    logger.error("Admin: Get products error:", err);
    return { success: false, error: err.message };
  }
};

const getProductByIdByAdmin = async (req) => {
  const { id } = req.params;

  const query = {
    ...buildProductQuery(id),
    deletedAt: null,
  };

  try {
    const product = await Product.findOne(query)
      .populate("vendorId", "firstName lastName email mobNo")
      .populate("storeId", "storeName storeCode")
      .populate("createdBy updatedBy", "firstName lastName");

    if (!product) return { success: false, notFound: true };

    return { success: true, data: product };
  } catch (err) {
    logger.error("Admin: Get product by ID error:", err);
    return { success: false, error: err.message };
  }
};

const updateProductByAdmin = async (req) => {
  const { id } = req.params;
  const {
    productName,
    productDescription,
    quantity,
    price,
    category,
    subcategory,
    status,
    vendorId,
    storeId,
  } = req.body;

  let product = await Product.findOne({
    ...buildProductQuery(id),
    deletedAt: null,
  });

  if (!product) {
    FileService.deleteUploadedFiles(req.files);
    return { success: false, notFound: true };
  }

  let productImages = product.productImages || [];

  if (req.files?.productImages?.length) {
    const newImages = req.files.productImages.map((f) =>
      FileService.generateFileObject(f)
    );
    productImages = [...productImages, ...newImages];
  }

  const updateData = {
    updatedBy: req.admin,
    productImages,
  };

  if (vendorId) updateData.vendorId = vendorId;
  if (storeId) updateData.storeId = storeId;
  if (productName !== undefined) updateData.productName = productName;
  if (productDescription !== undefined)
    updateData.productDescription = productDescription;
  if (category !== undefined) updateData.category = category;
  if (subcategory !== undefined) updateData.subcategory = subcategory || null;
  if (price !== undefined) updateData.price = price;

  if (quantity !== undefined) {
    updateData.quantity = quantity;

    if (quantity === 0) updateData.status = PRODUCT_STATUS.OUT_OF_STOCK;
    else if (quantity < 10) updateData.status = PRODUCT_STATUS.LOW_STOCK;
    else updateData.status = PRODUCT_STATUS.IN_STOCK;
  }

  if (status !== undefined) updateData.status = status;

  try {
    const updatedProduct = await Product.findOneAndUpdate(
      { ...buildProductQuery(id) },
      updateData,
      { new: true, runValidators: true }
    );

    // If admin changed storeId, move product reference from old store to new store
    try {
      const oldStoreId = product.storeId && product.storeId.toString();
      const newStoreId = updateData.storeId && updateData.storeId.toString();
      if (newStoreId && oldStoreId && newStoreId !== oldStoreId) {
        await Store.findByIdAndUpdate(oldStoreId, {
          $pull: { products: updatedProduct._id },
        });
        await Store.findByIdAndUpdate(newStoreId, {
          $push: { products: updatedProduct._id },
        });
      }
    } catch (storeErr) {
      logger.error("Admin: moving product between stores failed:", storeErr);
    }

    return { success: true, data: updatedProduct };
  } catch (err) {
    FileService.deleteUploadedFiles(req.files);
    logger.error("Admin: Update product error:", err);
    return { success: false, error: err.message };
  }
};

const deleteProductByAdmin = async (req) => {
  const { id } = req.params;

  const product = await Product.findOne({
    ...buildProductQuery(id),
    deletedAt: null,
  });

  if (!product) return { success: false, notFound: true };

  try {
    const deletedProduct = await Product.findOneAndUpdate(
      { ...buildProductQuery(id) },
      {
        deletedAt: new Date(),
        isActive: false,
        deletedBy: req.admin,
      },
      { new: true }
    );

    return { success: true, data: deletedProduct };
  } catch (err) {
    logger.error("Admin: Delete product error:", err);
    return { success: false, error: err.message };
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getCategories,
  getProductsForStore,
  // ✅ Admin services
  createProductByAdmin,
  getProductsByAdmin,
  getProductByIdByAdmin,
  updateProductByAdmin,
  deleteProductByAdmin,
};
