const joi = require("joi");

const updateStoreByAdmin = joi
  .object({
    storeName: joi.string().min(2).max(150).messages({
      "string.min": "Store name must be at least 2 characters",
      "string.max": "Store name cannot exceed 150 characters",
    }),

    storeAddress: joi.string().messages({
      "string.base": "Store address must be a string",
    }),

    description: joi.string().messages({
      "string.base": "Description must be a string",
    }),

    category: joi.string().messages({
      "string.base": "Category must be a string",
    }),

    deliveryAvailable: joi.boolean().messages({
      "boolean.base": "Delivery available must be true or false",
    }),

    deliveryRadius: joi.number().min(0).messages({
      "number.base": "Delivery radius must be a number",
      "number.min": "Delivery radius cannot be negative",
    }),

    minOrderValue: joi.number().min(0).messages({
      "number.base": "Min order value must be a number",
      "number.min": "Min order value cannot be negative",
    }),

    rating: joi.number().min(0).max(5).messages({
      "number.base": "Rating must be a number",
      "number.min": "Rating cannot be less than 0",
      "number.max": "Rating cannot exceed 5",
    }),

    location: joi
      .object({
        lat: joi
          .number()
          .min(-90)
          .max(90)
          .required()
          .messages({
            "number.base": "Latitude must be a number",
            "number.min": "Latitude cannot be less than -90",
            "number.max": "Latitude cannot be greater than 90",
          }),
        lng: joi
          .number()
          .min(-180)
          .max(180)
          .required()
          .messages({
            "number.base": "Longitude must be a number",
            "number.min": "Longitude cannot be less than -180",
            "number.max": "Longitude cannot be greater than 180",
          }),
      })
      .messages({
        "object.base": "Location must be an object with lat and lng",
      }),

    isApproved: joi.boolean().messages({
      "boolean.base": "isApproved must be true or false",
    }),
  })
  .min(1)
  .messages({
    "object.min": "At least one field is required to update the store",
  });

module.exports = {
  updateStoreByAdmin,
};
