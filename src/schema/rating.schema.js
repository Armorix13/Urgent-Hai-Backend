import Joi from "joi";

const courseIdParam = Joi.object({
  courseId: Joi.string()
    .required()
    .pattern(/^[a-fA-F0-9]{24}$/)
    .messages({
      "string.pattern.base": "courseId must be a valid id",
    }),
});

const submitRatingBody = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required().messages({
    "number.base": "rating must be a number between 1 and 5",
    "any.required": "rating is required",
  }),
  review: Joi.string().trim().max(2000).allow("").optional(),
});

const submitRatingSchema = {
  params: courseIdParam,
  body: submitRatingBody,
};

export default { submitRatingSchema };
