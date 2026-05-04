import Joi from "joi";
import mongoose from "mongoose";

const objectId = Joi.string().custom((value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error("any.invalid");
  }
  return value;
}, "ObjectId validation");

/** Optional Mongo ObjectId or null/empty to clear (e.g. collaborator on course). */
const optionalObjectIdOrEmpty = Joi.alternatives().try(
  Joi.valid(null, ""),
  objectId
);

/** Inline videos: synced to CourseVideo on POST/PUT /course (replace-all when `videos` is sent). */
const courseVideoInlineSchema = Joi.object().keys({
  video_url: Joi.string().trim().allow(null, "").optional(),
  videoUrl: Joi.string().trim().allow(null, "").optional(),
  title: Joi.string().trim().allow(null, "").optional(),
  description: Joi.string().trim().allow(null, "").optional(),
  order: Joi.number().optional(),
  isActive: Joi.boolean().optional(),
});

const courseContentSchema = Joi.object().keys({
  title: Joi.string().trim().required(),
  description: Joi.string().trim().optional(),
  videoUrl: Joi.string().trim().optional(),
  duration: Joi.string().trim().optional(),
  order: Joi.number().optional(),
  isPreview: Joi.boolean().optional(),
});

const addCourseSchema = {
  body: Joi.object()
    .keys({
      title: Joi.string().trim().max(200).required(),
      identifierId: Joi.string().trim().max(256).allow(null, "").optional(),
      description: Joi.string().trim().max(2000).required(),
      courseType: Joi.number().valid(1, 2).required(),
      price: Joi.number().when("courseType", {
        is: 1,
        then: Joi.number().positive().required().messages({
          "number.base": "Price must be a number for paid courses.",
          "number.positive": "Paid courses must have a price greater than zero.",
          "any.required": "Price is required for paid courses.",
        }),
        otherwise: Joi.number().valid(0).optional().messages({
          "any.only": "Free courses must use price 0.",
        }),
      }),
    benefits: Joi.array().items(Joi.string().max(500)).optional(),
    category: Joi.string().trim().max(100).required(),
    thumbnail: Joi.alternatives()
      .try(Joi.string().trim().max(2000), Joi.valid(null, ""))
      .optional(),
    duration: Joi.string().trim().optional(),
    level: Joi.string().valid("beginner", "intermediate", "advanced").optional(),
    tags: Joi.array().items(Joi.string().lowercase()).optional(),
    isActive: Joi.boolean().optional(),
    courseContent: Joi.array().items(courseContentSchema).optional(),
    videos: Joi.array().items(courseVideoInlineSchema).optional(),
    prerequisites: Joi.array().items(Joi.string().trim()).optional(),
    learningOutcomes: Joi.array().items(Joi.string().trim().max(300)).optional(),
    collaboratorId: optionalObjectIdOrEmpty.optional(),
    collaborators: optionalObjectIdOrEmpty.optional(),
    })
    .options({ stripUnknown: true }),
};

const updateCourseSchema = {
  params: Joi.object().keys({ id: objectId.required() }),
  body: Joi.object().keys({
    title: Joi.string().trim().max(200).optional(),
    identifierId: Joi.string().trim().max(256).allow(null, "").optional(),
    description: Joi.string().trim().max(2000).optional(),
    courseType: Joi.number().valid(1, 2).optional(),
    price: Joi.number().min(0).optional().messages({
      "number.min": "Price cannot be negative.",
    }),
    benefits: Joi.array().items(Joi.string().max(500)).optional(),
    category: Joi.string().trim().max(100).optional(),
    thumbnail: Joi.alternatives()
      .try(Joi.string().trim().max(2000), Joi.valid(null, ""))
      .optional(),
    duration: Joi.string().trim().optional(),
    level: Joi.string().valid("beginner", "intermediate", "advanced").optional(),
    tags: Joi.array().items(Joi.string().lowercase()).optional(),
    isActive: Joi.boolean().optional(),
    isDeleted: Joi.boolean().optional(),
    courseContent: Joi.array().items(courseContentSchema).optional(),
    videos: Joi.array().items(courseVideoInlineSchema).optional(),
    prerequisites: Joi.array().items(Joi.string().trim()).optional(),
    learningOutcomes: Joi.array().items(Joi.string().trim().max(300)).optional(),
    collaboratorId: optionalObjectIdOrEmpty.optional(),
    collaborators: optionalObjectIdOrEmpty.optional(),
  }),
};

const getCoursesSchema = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).optional(),
    search: Joi.string().optional(),
    courseType: Joi.number().valid(1, 2).optional(),
    category: Joi.string().optional(),
    level: Joi.string().valid("beginner", "intermediate", "advanced").optional(),
    /**
     * Convenience filter alias:
     * - paid/free -> courseType 1/2
     * - beginner/intermediate/advanced -> level
     */
    filter: Joi.string()
      .trim()
      .lowercase()
      .valid("paid", "free", "beginner", "intermediate", "advanced")
      .optional(),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid("asc", "desc").optional(),
    minPrice: Joi.number().optional(),
    maxPrice: Joi.number().optional(),
    tags: Joi.string().optional(),
    identifierId: Joi.string().trim().optional(),
    /** Opt-in: collaborator JWT + `mine=true` limits list to that collaborator's courses (default: full list). */
    mine: Joi.string().valid("true", "false").optional(),
  }),
};

const getCourseByIdSchema = {
  params: Joi.object().keys({ id: objectId.required() }),
};

const deleteCourseSchema = {
  params: Joi.object().keys({ id: objectId.required() }),
};

export default {
  addCourseSchema,
  updateCourseSchema,
  getCoursesSchema,
  getCourseByIdSchema,
  deleteCourseSchema,
};
