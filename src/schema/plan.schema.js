import Joi from "joi";
import mongoose from "mongoose";
import { currencyType } from "../utils/enum.js";

const objectId = Joi.string().custom((value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error("any.invalid");
  }
  return value;
}, "ObjectId validation");

const addPlanSchema = {
  body: Joi.object().keys({
    title: Joi.string().trim().max(100).required().messages({
      "string.max": "Title must be at most 100 characters long.",
      "any.required": "Title is required.",
      "string.empty": "Title cannot be empty.",
    }),
    durationMonths: Joi.number().integer().min(1).max(120).required().messages({
      "number.base": "Duration must be a number.",
      "number.min": "Duration must be at least 1 month.",
      "number.max": "Duration must be at most 120 months.",
      "any.required": "Duration is required.",
    }),
    price: Joi.number().min(0).required().messages({
      "number.base": "Price must be a number.",
      "number.min": "Price cannot be negative.",
      "any.required": "Price is required.",
    }),
    currency: Joi.string()
      .valid(...Object.values(currencyType))
      .optional()
      .messages({
        "any.only": `Currency must be one of: ${Object.values(currencyType).join(", ")}.`,
      }),
    discountPercentage: Joi.number().min(0).max(100).optional().messages({
      "number.min": "Discount must be at least 0.",
      "number.max": "Discount cannot exceed 100.",
    }),
    isActive: Joi.boolean().optional(),
  }),
};

const getAllPlansSchema = {
  query: Joi.object().keys({
    limit: Joi.number().integer().min(1).optional(),
    page: Joi.number().integer().min(1).optional(),
    isActive: Joi.boolean().optional(),
  }),
};

const updatePlanSchema = {
  params: Joi.object().keys({
    id: objectId.required().messages({
      "any.required": "Plan ID is required.",
      "any.invalid": "Invalid plan ID.",
    }),
  }),
  body: Joi.object().keys({
    title: Joi.string().trim().max(100).optional().messages({
      "string.max": "Title must be at most 100 characters long.",
      "string.empty": "Title cannot be empty.",
    }),
    durationMonths: Joi.number().integer().min(1).max(120).optional().messages({
      "number.min": "Duration must be at least 1 month.",
    }),
    price: Joi.number().min(0).optional().messages({
      "number.min": "Price cannot be negative.",
    }),
    currency: Joi.string()
      .valid(...Object.values(currencyType))
      .optional(),
    discountPercentage: Joi.number().min(0).max(100).optional(),
    isActive: Joi.boolean().optional(),
  }),
};

const getPlanByIdSchema = {
  params: Joi.object().keys({
    id: objectId.required().messages({
      "any.required": "Plan ID is required.",
      "any.invalid": "Invalid plan ID.",
    }),
  }),
};

const deletePlanSchema = {
  params: Joi.object().keys({
    id: objectId.required().messages({
      "any.required": "Plan ID is required.",
      "any.invalid": "Invalid plan ID.",
    }),
  }),
};

const planValidationSchemas = {
  addPlanSchema,
  getAllPlansSchema,
  getPlanByIdSchema,
  updatePlanSchema,
  deletePlanSchema,
};

export default planValidationSchemas;
