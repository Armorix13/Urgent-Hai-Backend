import express from "express";
import { planController } from "../controllers/plan.controller.js";
import authenticate from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import planValidationSchemas from "../schema/plan.schema.js";

const planRoute = express.Router();

// Public - Get all active plans (Subscription screen)
planRoute.get(
  "/",
  validate(planValidationSchemas.getAllPlansSchema),
  planController.getAllPlans
);

// Public - Get single plan
planRoute.get(
  "/:id",
  validate(planValidationSchemas.getPlanByIdSchema),
  planController.getPlanById
);

// Protected - Admin/Manage plans
planRoute.post(
  "/",
  authenticate,
  validate(planValidationSchemas.addPlanSchema),
  planController.addPlan
);

planRoute.put(
  "/:id",
  authenticate,
  validate(planValidationSchemas.updatePlanSchema),
  planController.updatePlan
);

planRoute.delete(
  "/:id",
  authenticate,
  validate(planValidationSchemas.deletePlanSchema),
  planController.deletePlan
);

export default planRoute;
