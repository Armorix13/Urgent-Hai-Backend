import Joi from "joi";

const courseIdParam = Joi.object({
  courseId: Joi.string()
    .required()
    .pattern(/^[a-fA-F0-9]{24}$/)
    .messages({
      "string.pattern.base": "courseId must be a valid id",
    }),
});

const mongoIdParam = (name) =>
  Joi.object({
    [name]: Joi.string()
      .required()
      .pattern(/^[a-fA-F0-9]{24}$/)
      .messages({
        "string.pattern.base": `${name} must be a valid id`,
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

/** Express query strings — validated as digits, parsed in service with parseInt. */
const paginationQuery = Joi.object({
  page: Joi.string().pattern(/^\d+$/).optional(),
  limit: Joi.string().pattern(/^\d+$/).optional(),
});

const collaboratorOverviewSchema = {
  query: Joi.object({}),
};

const collaboratorCoursesQuery = Joi.object({
  page: Joi.string().pattern(/^\d+$/).optional(),
  limit: Joi.string().pattern(/^\d+$/).optional(),
  search: Joi.string().trim().max(200).allow("").optional(),
});

const collaboratorCoursesSchema = {
  query: collaboratorCoursesQuery,
};

const collaboratorCourseReviewsSchema = {
  params: mongoIdParam("courseId"),
  query: paginationQuery,
};

const collaboratorDeleteReviewSchema = {
  params: mongoIdParam("ratingId"),
};

export default {
  submitRatingSchema,
  collaboratorOverviewSchema,
  collaboratorCoursesSchema,
  collaboratorCourseReviewsSchema,
  collaboratorDeleteReviewSchema,
};
