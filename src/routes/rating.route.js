import express from "express";
import { ratingController } from "../controllers/rating.controller.js";
import authenticate from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import ratingSchema from "../schema/rating.schema.js";

const ratingRoute = express.Router();

/** Collaborator: analytics across all ratings on their courses. */
ratingRoute.get(
  "/collaborator/overview",
  authenticate,
  validate(ratingSchema.collaboratorOverviewSchema),
  ratingController.collaboratorOverview
);

/** Collaborator: paginated list of courses they own (for picking a course). */
ratingRoute.get(
  "/collaborator/courses",
  authenticate,
  validate(ratingSchema.collaboratorCoursesSchema),
  ratingController.collaboratorCourses
);

/** Collaborator: paginated reviews for one owned course. */
ratingRoute.get(
  "/collaborator/course/:courseId/reviews",
  authenticate,
  validate(ratingSchema.collaboratorCourseReviewsSchema),
  ratingController.collaboratorCourseReviews
);

/** Collaborator: delete a learner review/rating on an owned course. */
ratingRoute.delete(
  "/collaborator/review/:ratingId",
  authenticate,
  validate(ratingSchema.collaboratorDeleteReviewSchema),
  ratingController.collaboratorDeleteReview
);

/**
 * POST /api/v1/rating/:courseId
 * Body: { "rating": 1-5, "review": "optional string" }
 * User must be actively enrolled in the course.
 */
ratingRoute.post(
  "/:courseId",
  authenticate,
  validate(ratingSchema.submitRatingSchema),
  ratingController.submitRating
);

export default ratingRoute;
