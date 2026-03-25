import express from "express";
import { courseController } from "../controllers/course.controller.js";
import authenticate from "../middlewares/auth.middleware.js";
import optionalAuth from "../middlewares/optionalAuth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import courseSchema from "../schema/course.schema.js";

const courseRoute = express.Router();

// Public (optional Bearer token → unlocks video URLs when allowed)
courseRoute.get(
  "/",
  optionalAuth,
  validate(courseSchema.getCoursesSchema),
  courseController.getCourses
);
courseRoute.get(
  "/:id",
  optionalAuth,
  validate(courseSchema.getCourseByIdSchema),
  courseController.getCourseById
);
courseRoute.get(
  "/:id/similar",
  optionalAuth,
  validate(courseSchema.getCourseByIdSchema),
  courseController.getSimilarCourses
);

// Protected - Admin
courseRoute.post(
  "/",
  authenticate,
  validate(courseSchema.addCourseSchema),
  courseController.addCourse
);
courseRoute.put(
  "/:id",
  authenticate,
  validate(courseSchema.updateCourseSchema),
  courseController.updateCourse
);
courseRoute.delete(
  "/:id",
  authenticate,
  validate(courseSchema.deleteCourseSchema),
  courseController.deleteCourse
);
courseRoute.delete(
  "/:id/hard",
  authenticate,
  validate(courseSchema.deleteCourseSchema),
  courseController.hardDeleteCourse
);

export default courseRoute;
