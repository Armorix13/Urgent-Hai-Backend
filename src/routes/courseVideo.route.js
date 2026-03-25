import express from "express";
import { courseVideoController } from "../controllers/courseVideo.controller.js";
import authenticate from "../middlewares/auth.middleware.js";
import optionalAuth from "../middlewares/optionalAuth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import courseVideoSchema from "../schema/courseVideo.schema.js";

const courseVideoRoute = express.Router();

courseVideoRoute.post(
  "/",
  authenticate,
  validate(courseVideoSchema.addCourseVideoSchema),
  courseVideoController.addCourseVideo
);
courseVideoRoute.get(
  "/course/:courseId",
  optionalAuth,
  validate(courseVideoSchema.getVideosByCourseSchema),
  courseVideoController.getVideosByCourseId
);
courseVideoRoute.get(
  "/:id",
  optionalAuth,
  validate(courseVideoSchema.getCourseVideoByIdSchema),
  courseVideoController.getCourseVideoById
);
courseVideoRoute.put(
  "/:id",
  authenticate,
  validate(courseVideoSchema.updateCourseVideoSchema),
  courseVideoController.updateCourseVideo
);
courseVideoRoute.delete(
  "/:id",
  authenticate,
  validate(courseVideoSchema.deleteCourseVideoSchema),
  courseVideoController.deleteCourseVideo
);

export default courseVideoRoute;
