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

export default {
  enrollSchema,
  updateProgressSchema,
  getEnrollmentByIdSchema,
};
