import Joi from "joi";
import mongoose from "mongoose";

// Validate MongoDB ObjectId
const objectId = Joi.string().custom((value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error("any.invalid");
  }
  return value;
}, "ObjectId validation");

const addCategorySchema = {
  body: Joi.object().keys({
    name: Joi.string().min(3).max(50).required().messages({
      "string.base": "Name must be a string.",
      "string.empty": "Name is required.",
      "string.min": "Name must be at least 3 characters.",
      "any.required": "Name is required.",
    }),
    description: Joi.string().allow("").optional().messages({
      "string.base": "Description must be a string.",
    }),
    image: Joi.string().uri().optional().messages({
      "string.uri": "Image must be a valid URL.",
    }),
  }),
};

const getAllCategoriesSchema = {
  query: Joi.object().keys({
    limit: Joi.number().integer().min(1).optional().messages({
      "number.base": "Limit must be a number.",
      "number.min": "Limit must be at least 1.",
    }),
    page: Joi.number().integer().min(1).optional().messages({
      "number.base": "Page must be a number.",
      "number.min": "Page must be at least 1.",
    }),
  }),
};

const updateCategorySchema = {
  params: Joi.object().keys({
    id: objectId.required().messages({
      "any.required": "Category ID is required.",
      "any.invalid": "Invalid category ID.",
    }),
  }),
  body: Joi.object().keys({
    name: Joi.string().min(3).max(50).optional().messages({
      "string.min": "Name must be at least 3 characters.",
    }),
    description: Joi.string().allow("").optional(),
    image: Joi.string().uri().optional().messages({
      "string.uri": "Image must be a valid URL.",
    }),
    isActive: Joi.boolean().optional().messages({
      "boolean.base": "isActive must be a boolean value (true or false).",
    }),
  }),
};

const deleteCategorySchema = {
  params: Joi.object().keys({
    id: objectId.required().messages({
      "any.required": "Category ID is required.",
      "any.invalid": "Invalid category ID.",
    }),
  }),
};

const categoryValidationSchemas = {
  addCategorySchema,
  getAllCategoriesSchema,
  updateCategorySchema,
  deleteCategorySchema,
};

export default categoryValidationSchemas;
