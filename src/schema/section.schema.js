import Joi from "joi";
import mongoose from "mongoose";

const objectId = Joi.string().custom((value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error("any.invalid");
  }
  return value;
}, "ObjectId validation");

const contentItemSchema = Joi.object({
  title: Joi.string().trim().required(),
  url: Joi.string().trim().required(),
  description: Joi.string().trim().allow("", null).optional(),
  thumbnail: Joi.string().allow("", null).optional(),
  duration: Joi.string().allow("", null).optional(),
  order: Joi.number().optional(),
});

const upsertSectionSchema = {
  body: Joi.object({
    sectionId: objectId.optional(),
    collaboratorId: objectId.required().messages({
      "any.required": "collaboratorId is required.",
    }),
    title: Joi.string().trim().max(300).required().messages({
      "any.required": "title is required.",
      "string.empty": "title cannot be empty.",
    }),
    description: Joi.string().trim().allow("", null).max(2000).optional(),
    content: Joi.array().items(contentItemSchema).optional().default([]),
    isActive: Joi.boolean().optional(),
    order: Joi.number().optional(),
  }),
};

const getSectionByIdSchema = {
  params: Joi.object({
    id: objectId.required(),
  }),
};

const deleteSectionSchema = {
  params: Joi.object({
    id: objectId.required(),
  }),
};

const getSectionsByCollaboratorSchema = {
  params: Joi.object({
    collaboratorId: objectId.required(),
  }),
};

const sectionValidationSchemas = {
  upsertSectionSchema,
  getSectionByIdSchema,
  deleteSectionSchema,
  getSectionsByCollaboratorSchema,
};

export default sectionValidationSchemas;
