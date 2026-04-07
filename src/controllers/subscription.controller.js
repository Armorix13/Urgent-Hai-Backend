import { subscriptionService } from "../services/subscription.service.js";

const purchaseSubscription = async (req, res, next) => {
  try {
    const { subscription } = await subscriptionService.purchaseSubscription(req);
    return res.status(201).json({
      success: true,
      message: "Subscription initiated. Complete payment to activate.",
      subscription,
    });
  } catch (error) {
    next(error);
  }
};

const confirmPayment = async (req, res, next) => {
  try {
    const { subscription } = await subscriptionService.confirmPayment(req);
    return res.status(200).json({
      success: true,
      message: "Payment confirmed. Subscription is now active!",
      subscription,
    });
  } catch (error) {
    next(error);
  }
};

const getAllSubscriptions = async (req, res, next) => {
  try {
    const data = await subscriptionService.getAllSubscriptions(req);
    return res.status(200).json({
      success: true,
      message: "Subscriptions fetched successfully!",
      ...data,
    });
  } catch (error) {
    next(error);
  }
};

const getSubscriptionById = async (req, res, next) => {
  try {
    const { subscription } = await subscriptionService.getSubscriptionById(req);
    return res.status(200).json({
      success: true,
      message: "Subscription fetched successfully!",
      subscription,
    });
  } catch (error) {
    next(error);
  }
};

const getActiveSubscription = async (req, res, next) => {
  try {
    const { subscription } = await subscriptionService.getActiveSubscription(req);
    return res.status(200).json({
      success: true,
      message: subscription
        ? "Active subscription found."
        : "No active subscription.",
      subscription,
    });
  } catch (error) {
    next(error);
  }
};

export const subscriptionController = {
  purchaseSubscription,
  confirmPayment,
  getAllSubscriptions,
  getSubscriptionById,
  getActiveSubscription,
};
