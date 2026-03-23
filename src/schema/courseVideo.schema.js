import Joi from "joi";
import mongoose from "mongoose";

const objectId = Joi.string().custom((value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error("any.invalid");
  }
  return value;
}, "ObjectId validation");

const addCourseVideoSchema = {
  body: Joi.object().keys({
    courseId: objectId.required(),
    video_url: Joi.string().trim().optional(),
    title: Joi.string().trim().optional(),
    description: Joi.string().trim().optional(),
    order: Joi.number().optional(),
    isActive: Joi.boolean().optional(),
  }),
};

const updateCourseVideoSchema = {
  params: Joi.object().keys({ id: objectId.required() }),
  body: Joi.object().keys({
    video_url: Joi.string().trim().optional(),
    title: Joi.string().trim().optional(),
    description: Joi.string().trim().optional(),
    order: Joi.number().optional(),
    isActive: Joi.boolean().optional(),
  }),
};

const getVideosByCourseSchema = {
  params: Joi.object().keys({ courseId: objectId.required() }),
};

const getCourseVideoByIdSchema = {
  params: Joi.object().keys({ id: objectId.required() }),
};

const deleteCourseVideoSchema = {
  params: Joi.object().keys({ id: objectId.required() }),
};

export default {
  addCourseVideoSchema,
  updateCourseVideoSchema,
  getVideosByCourseSchema,
  getCourseVideoByIdSchema,
  deleteCourseVideoSchema,
};
