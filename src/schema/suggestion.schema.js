import Joi from "joi";

const mongoObjectId = Joi.string()
  .hex()
  .length(24)
  .required()
  .messages({
    "string.length": "userId must be a valid 24-character id",
  });

const addSuggestionSchema = {
  body: Joi.object().keys({
    title: Joi.string().trim().max(200).required().messages({
      "string.max": "Title must be at most 200 characters long.",
      "any.required": "Title is required.",
      "string.empty": "Title cannot be empty.",
    }),
    description: Joi.string().trim().max(2000).required().messages({
      "string.max": "Description must be at most 2000 characters long.",
      "any.required": "Description is required.",
      "string.empty": "Description cannot be empty.",
    }),
  }),
};

const updateSuggestionSchema = {
  body: Joi.object()
    .keys({
      title: Joi.string().trim().max(200).optional().messages({
        "string.max": "Title must be at most 200 characters long.",
        "string.empty": "Title cannot be empty.",
      }),
      description: Joi.string().trim().max(2000).optional().messages({
        "string.max": "Description must be at most 2000 characters long.",
        "string.empty": "Description cannot be empty.",
      }),
    })
    .min(1)
    .messages({
      "object.min": "At least one of title or description is required.",
    }),
};

const getSuggestionsByUserIdSchema = {
  params: Joi.object({
    userId: mongoObjectId,
  }),
};

const suggestionValidationSchemas = {
  addSuggestionSchema,
  updateSuggestionSchema,
  getSuggestionsByUserIdSchema,
};

export default suggestionValidationSchemas;
