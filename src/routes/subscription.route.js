import express from "express";
import { subscriptionController } from "../controllers/subscription.controller.js";
import authenticate from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import subscriptionValidationSchemas from "../schema/subscription.schema.js";

const subscriptionRoute = express.Router();

// All routes require authentication
subscriptionRoute.use(authenticate);

// Purchase subscription (Pay button)
subscriptionRoute.post(
  "/purchase",
  validate(subscriptionValidationSchemas.purchaseSubscriptionSchema),
  subscriptionController.purchaseSubscription
);

// Confirm payment (after Razorpay/Stripe success)
// Supports: PUT /subscription/:id/confirm-payment  OR  PUT /subscription/purchase/:id/confirm-payment
subscriptionRoute.put(
  "/:id/confirm-payment",
  validate(subscriptionValidationSchemas.confirmPaymentSchema),
  subscriptionController.confirmPayment
);
subscriptionRoute.put(
  "/purchase/:id/confirm-payment",
  validate(subscriptionValidationSchemas.confirmPaymentSchema),
  subscriptionController.confirmPayment
);

// Get all user subscriptions (must be before /:id)
subscriptionRoute.get(
  "/",
  validate(subscriptionValidationSchemas.getAllSubscriptionsSchema),
  subscriptionController.getAllSubscriptions
);

// Get active subscription (must be before /:id to avoid "active" as id)
subscriptionRoute.get("/active", subscriptionController.getActiveSubscription);

// Get single subscription
subscriptionRoute.get(
  "/:id",
  validate(subscriptionValidationSchemas.getSubscriptionByIdSchema),
  subscriptionController.getSubscriptionById
);

export default subscriptionRoute;
