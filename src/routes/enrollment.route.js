import express from "express";
import { enrollmentController } from "../controllers/enrollment.controller.js";
import authenticate from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import enrollmentSchema from "../schema/enrollment.schema.js";

const enrollmentRoute = express.Router();

enrollmentRoute.use(authenticate);

enrollmentRoute.post(
  "/",
  validate(enrollmentSchema.enrollSchema),
  enrollmentController.enroll
);
enrollmentRoute.get(
  "/",
  validate(enrollmentSchema.getUserEnrollmentsSchema),
  enrollmentController.getUserEnrollments
);
enrollmentRoute.get(
  "/:id",
  validate(enrollmentSchema.getEnrollmentByIdSchema),
  enrollmentController.getEnrollmentById
);
enrollmentRoute.put(
  "/:id/progress",
  validate(enrollmentSchema.updateProgressSchema),
  enrollmentController.updateProgress
);
enrollmentRoute.put(
  "/:id/cancel",
  validate(enrollmentSchema.getEnrollmentByIdSchema),
  enrollmentController.cancelEnrollment
);

export default enrollmentRoute;
