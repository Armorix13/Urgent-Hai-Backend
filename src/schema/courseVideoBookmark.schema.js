import Joi from "joi";
import mongoose from "mongoose";

const objectId = Joi.string().custom((value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error("any.invalid");
  }
  return value;
}, "ObjectId validation");

const addBookmarkSchema = {
  body: Joi.object()
    .keys({
      title: Joi.string().trim().min(1).max(300).required().messages({
        "any.required": "title is required.",
        "string.empty": "title cannot be empty.",
      }),
      videoUrl: Joi.string().trim().min(1).max(2000).required().messages({
        "any.required": "videoUrl is required.",
        "string.empty": "videoUrl cannot be empty.",
      }),
      description: Joi.string().trim().max(5000).allow("").optional(),
      userId: Joi.any().strip(),
      courseVideoId: Joi.any().strip(),
      note: Joi.any().strip(),
    })
    .options({ stripUnknown: true }),
};

const getMyBookmarksSchema = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
  }),
};

const deleteBookmarkSchema = {
  params: Joi.object().keys({
    id: objectId.required().messages({
      "any.required": "Bookmark ID is required.",
      "any.invalid": "Invalid bookmark ID.",
    }),
  }),
};

const courseVideoBookmarkValidationSchemas = {
  addBookmarkSchema,
  getMyBookmarksSchema,
  deleteBookmarkSchema,
};

export default courseVideoBookmarkValidationSchemas;
