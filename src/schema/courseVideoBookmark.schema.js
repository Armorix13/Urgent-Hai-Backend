import Joi from "joi";
import mongoose from "mongoose";

const objectId = Joi.string().custom((value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error("any.invalid");
  }
  return value;
}, "ObjectId validation");

const addBookmarkSchema = {
  body: Joi.object().keys({
    courseVideoId: objectId.required().messages({
      "any.required": "Course video ID is required.",
      "any.invalid": "Invalid course video ID.",
    }),
    note: Joi.string().trim().max(500).allow("").optional(),
    userId: Joi.any().strip(),
  }),
};

const getMyBookmarksSchema = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
  }),
};

const bookmarkIdParamSchema = {
  params: Joi.object().keys({
    id: objectId.required().messages({
      "any.required": "Bookmark ID is required.",
      "any.invalid": "Invalid bookmark ID.",
    }),
  }),
};

const updateBookmarkSchema = {
  params: Joi.object().keys({
    id: objectId.required().messages({
      "any.required": "Bookmark ID is required.",
      "any.invalid": "Invalid bookmark ID.",
    }),
  }),
  body: Joi.object()
    .keys({
      note: Joi.string().trim().max(500).allow("").required().messages({
        "any.required": "note is required (can be empty string).",
      }),
      courseVideoId: Joi.any().strip(),
      userId: Joi.any().strip(),
    })
    .required(),
};

const deleteBookmarkSchema = bookmarkIdParamSchema;

const courseVideoBookmarkValidationSchemas = {
  addBookmarkSchema,
  getMyBookmarksSchema,
  bookmarkIdParamSchema,
  updateBookmarkSchema,
  deleteBookmarkSchema,
};

export default courseVideoBookmarkValidationSchemas;
