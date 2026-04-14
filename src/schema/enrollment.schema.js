import Joi from "joi";
import mongoose from "mongoose";

const objectId = Joi.string().custom((value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error("any.invalid");
  }
  return value;
}, "ObjectId validation");

const enrollSchema = {
  body: Joi.object().keys({
    courseId: objectId.required(),
    transactionId: Joi.string().trim().optional(),
    paymentMethod: Joi.string().trim().optional(),
  }),
};

const updateProgressSchema = {
  params: Joi.object().keys({ id: objectId.required() }),
  body: Joi.object().keys({
    completedLessonOrders: Joi.array().items(Joi.number()).optional(),
    completionPercentage: Joi.number().min(0).max(100).optional(),
  }),
};

const getEnrollmentByIdSchema = {
  params: Joi.object().keys({ id: objectId.required() }),
};

/** GET /enrollment — optional query keys (ignored by list handler; allowed for clients). */
const getUserEnrollmentsSchema = {
  query: Joi.object()
    .keys({
      productIds: Joi.alternatives()
        .try(Joi.string().trim().allow(""), Joi.array().items(Joi.string()))
        .optional(),
      product_ids: Joi.alternatives()
        .try(Joi.string().trim().allow(""), Joi.array().items(Joi.string()))
        .optional(),
    })
    .unknown(true),
};

export default {
  enrollSchema,
  updateProgressSchema,
  getEnrollmentByIdSchema,
  getUserEnrollmentsSchema,
};
