const joi = require("joi");
const { CATEGORIES_LIST, SUBCATEGORIES_LIST, PRODUCT_STATUS } = require("../../../../../config/constants/productConstant");

const createProduct = joi.object({
  productName: joi.string().min(2).max(200).required().messages({
    "string.empty": "Product name is required",
    "string.min": "Product name must be at least 2 characters",
    "string.max": "Product name cannot exceed 200 characters",
  }),
  productDescription: joi.string().allow("", null).max(5000).messages({
    "string.max": "Product description cannot exceed 5000 characters",
  }),
  quantity: joi.number().integer().min(0).required().messages({
    "number.base": "Quantity must be a number",
    "number.min": "Quantity cannot be negative",
    "any.required": "Quantity is required",
  }),
  price: joi.number().min(0).required().messages({
    "number.base": "Price must be a number",
    "number.min": "Price cannot be negative",
    "any.required": "Price is required",
  }),
  category: joi.string().valid(...CATEGORIES_LIST).required().messages({
    "any.only": "Invalid category",
    "any.required": "Category is required",
  }),
  subcategory: joi.string().valid(...SUBCATEGORIES_LIST).allow("", null).messages({
    "any.only": "Invalid subcategory",
  }),
  status: joi.string().valid(...Object.values(PRODUCT_STATUS)).allow("", null).messages({
    "any.only": "Invalid status",
  }),
  storeId: joi.string().required().messages({
    "string.empty": "Store ID is required",
  }),
});

const updateProduct = joi.object({
  productName: joi.string().min(2).max(200).messages({
    "string.min": "Product name must be at least 2 characters",
    "string.max": "Product name cannot exceed 200 characters",
  }),
  productDescription: joi.string().allow("", null).max(5000).messages({
    "string.max": "Product description cannot exceed 5000 characters",
  }),
  quantity: joi.number().integer().min(0).messages({
    "number.base": "Quantity must be a number",
    "number.min": "Quantity cannot be negative",
  }),
  price: joi.number().min(0).messages({
    "number.base": "Price must be a number",
    "number.min": "Price cannot be negative",
  }),
  category: joi.string().valid(...CATEGORIES_LIST).messages({
    "any.only": "Invalid category",
  }),
  subcategory: joi.string().valid(...SUBCATEGORIES_LIST).allow("", null).messages({
    "any.only": "Invalid subcategory",
  }),
  status: joi.string().valid(...Object.values(PRODUCT_STATUS)).allow("", null).messages({
    "any.only": "Invalid status",
  }),
}).min(1).messages({
  "object.min": "At least one field must be provided for update",
});

const getProducts = joi.object({
  page: joi.number().integer().min(1).default(1),
  limit: joi.number().integer().min(1).max(100).default(10),
  category: joi.string().valid(...CATEGORIES_LIST).allow("", null),
  subcategory: joi.string().valid(...SUBCATEGORIES_LIST).allow("", null),
  status: joi.string().valid(...Object.values(PRODUCT_STATUS)).allow("", null),
  search: joi.string().allow("", null),
  storeId: joi.string().allow("", null),
});

const getProductById = joi.object({
  id: joi.string().required().messages({
    "string.empty": "Product ID is required",
  }),
});

module.exports = {
  createProduct,
  updateProduct,
  getProducts,
  getProductById,
};

