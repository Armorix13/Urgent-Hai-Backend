import Joi from "joi";
import mongoose from "mongoose";
import {
  subscriptionStatusType,
  paymentStatusType,
} from "../utils/enum.js";

const objectId = Joi.string().custom((value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error("any.invalid");
  }
  return value;
}, "ObjectId validation");

const purchaseSubscriptionSchema = {
  body: Joi.object().keys({
    planId: objectId.required().messages({
      "any.required": "Plan ID is required.",
      "any.invalid": "Invalid plan ID.",
    }),
    paymentReference: Joi.string().trim().max(200).optional().messages({
      "string.max": "Payment reference is too long.",
    }),
  }),
};

const getAllSubscriptionsSchema = {
  query: Joi.object().keys({
    limit: Joi.number().integer().min(1).optional(),
    page: Joi.number().integer().min(1).optional(),
    status: Joi.number()
      .valid(...Object.values(subscriptionStatusType))
      .optional(),
  }),
};

const getSubscriptionByIdSchema = {
  params: Joi.object().keys({
    id: objectId.required().messages({
      "any.required": "Subscription ID is required.",
      "any.invalid": "Invalid subscription ID.",
    }),
  }),
};

const confirmPaymentSchema = {
  params: Joi.object().keys({
    id: objectId.required().messages({
      "any.required": "Subscription ID is required.",
      "any.invalid": "Invalid subscription ID.",
    }),
  }),
  body: Joi.object().keys({
    paymentReference: Joi.string().trim().max(200).optional(),
    paymentStatus: Joi.number()
      .valid(...Object.values(paymentStatusType))
      .optional(),
  }),
};

const subscriptionValidationSchemas = {
  purchaseSubscriptionSchema,
  getAllSubscriptionsSchema,
  getSubscriptionByIdSchema,
  confirmPaymentSchema,
};

export default subscriptionValidationSchemas;
