import express from "express";
import { ratingController } from "../controllers/rating.controller.js";
import authenticate from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import ratingSchema from "../schema/rating.schema.js";

const ratingRoute = express.Router();

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
