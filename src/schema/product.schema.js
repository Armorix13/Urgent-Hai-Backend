import Joi from "joi";
import mongoose from "mongoose";

// MongoDB ObjectId validator
const objectId = Joi.string().custom((value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error("any.invalid");
  }
  return value;
}, "ObjectId validation");

// Common reusable schema for `images` and `tags`
const stringArray = Joi.array().items(Joi.string().trim()).messages({
  "array.base": "Must be an array of strings.",
});

const addProductSchema = {
  body: Joi.object().keys({
    name: Joi.string().min(3).max(100).required().messages({
      "any.required": "Product name is required.",
      "string.min": "Product name must be at least 3 characters.",
    }),
    description: Joi.string().allow("").optional(),
    price: Joi.number().min(0).required().messages({
      "any.required": "Price is required.",
      "number.base": "Price must be a number.",
    }),
    discountPrice: Joi.number().min(0).optional().messages({
      "number.base": "Discount price must be a number.",
    }),
    images: stringArray.optional(),
    category: objectId.required().messages({
      "any.required": "Category ID is required.",
      "any.invalid": "Invalid category ID.",
    }),
    stock: Joi.number().integer().min(0).optional().messages({
      "number.base": "Stock must be a number.",
      "number.min": "Stock cannot be negative.",
    }),
    tags: stringArray.optional(),
    isFeatured: Joi.boolean().optional(),
    isActive: Joi.boolean().optional(),
  }),
};

const getAllProductsSchema = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).optional().messages({
      "number.base": "Page must be a number.",
      "number.min": "Page must be at least 1.",
    }),
    limit: Joi.number().integer().min(1).optional().messages({
      "number.base": "Limit must be a number.",
      "number.min": "Limit must be at least 1.",
    }),
  }),
};

const getProductByIdSchema = {
  params: Joi.object().keys({
    id: objectId.required().messages({
      "any.required": "Product ID is required.",
      "any.invalid": "Invalid product ID.",
    }),
  }),
};

const updateProductSchema = {
  params: Joi.object().keys({
    id: objectId.required().messages({
      "any.required": "Product ID is required.",
      "any.invalid": "Invalid product ID.",
    }),
  }),
  body: Joi.object().keys({
    name: Joi.string().min(3).max(100).optional(),
    description: Joi.string().allow("").optional(),
    price: Joi.number().min(0).optional(),
    discountPrice: Joi.number().min(0).optional(),
    images: stringArray.optional(),
    category: objectId.optional(),
    stock: Joi.number().integer().min(0).optional(),
    tags: stringArray.optional(),
    isFeatured: Joi.boolean().optional(),
    isActive: Joi.boolean().optional(),
  }),
};

const deleteProductSchema = {
  params: Joi.object().keys({
    id: objectId.required().messages({
      "any.required": "Product ID is required.",
      "any.invalid": "Invalid product ID.",
    }),
  }),
};

const productValidationSchemas = {
  addProductSchema,
  getAllProductsSchema,
  getProductByIdSchema,
  updateProductSchema,
  deleteProductSchema,
};

export default productValidationSchemas;
