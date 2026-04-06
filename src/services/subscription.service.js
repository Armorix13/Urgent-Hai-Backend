import Subscription from "../models/subscription.model.js";
import Plan from "../models/plan.model.js";
import {
  subscriptionStatusType,
  paymentStatusType,
} from "../utils/enum.js";
import { getPublicUserById } from "../utils/userPublic.util.js";

export const getSubscriptionById = async (id) => {
  return await Subscription.findById(id).populate("planId", "title price currency durationMonths discountPercentage");
};

const purchaseSubscription = async (req) => {
  try {
    const userId = req.userId;
    const { planId, paymentReference } = req.body;

    const plan = await Plan.findById(planId);
    if (!plan) {
      throw new Error("Plan not found.");
    }

    if (!plan.isActive) {
      throw new Error("This plan is no longer available.");
    }

    const subscription = new Subscription({
      userId,
      planId,
      paymentReference: paymentReference || undefined,
      status: subscriptionStatusType.PENDING,
      paymentStatus: paymentStatusType.PENDING,
    });

    await subscription.save();

    const [populated, user] = await Promise.all([
      Subscription.findById(subscription._id)
        .populate("planId", "title price currency durationMonths discountPercentage")
        .lean(),
      getPublicUserById(userId),
    ]);

    return { subscription: populated, user };
  } catch (error) {
    throw error;
  }
};

const confirmPayment = async (req) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { paymentReference } = req.body;

    const subscription = await Subscription.findById(id).populate("planId");
    if (!subscription) {
      throw new Error("Subscription not found.");
    }

    if (subscription.userId.toString() !== userId) {
      throw new Error("Unauthorized to update this subscription.");
    }

    if (subscription.status !== subscriptionStatusType.PENDING) {
      throw new Error("Subscription is not in pending state.");
    }

    const now = new Date();
    let expiresAt = new Date(now);

    if (subscription.planId && subscription.planId.durationMonths) {
      expiresAt.setMonth(expiresAt.getMonth() + subscription.planId.durationMonths);
    }

    subscription.status = subscriptionStatusType.ACTIVE;
    subscription.paymentStatus = paymentStatusType.PAID;
    subscription.startedAt = now;
    subscription.expiresAt = expiresAt;
    if (paymentReference) subscription.paymentReference = paymentReference;

    await subscription.save();

    const [populated, user] = await Promise.all([
      Subscription.findById(subscription._id)
        .populate("planId", "title price currency durationMonths discountPercentage")
        .lean(),
      getPublicUserById(userId),
    ]);

    return { subscription: populated, user };
  } catch (error) {
    throw error;
  }
};

const getAllSubscriptions = async (req) => {
  try {
    const userId = req.userId;
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const status = req.query.status ? parseInt(req.query.status) : undefined;

    const skip = (page - 1) * limit;

    const filter = { userId };
    if (status !== undefined) {
      filter.status = status;
    }

    const [subscriptions, total, user] = await Promise.all([
      Subscription.find(filter)
        .populate("planId", "title price currency durationMonths discountPercentage")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Subscription.countDocuments(filter),
      getPublicUserById(userId),
    ]);

    return {
      subscriptions,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      user,
    };
  } catch (error) {
    throw error;
  }
};

const getSubscriptionByIdService = async (req) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const subscription = await getSubscriptionById(id);
    if (!subscription) {
      throw new Error("Subscription not found.");
    }

    if (subscription.userId.toString() !== userId) {
      throw new Error("Unauthorized to view this subscription.");
    }

    const lean =
      subscription.toObject?.() ?? subscription;
    const user = await getPublicUserById(userId);
    return { subscription: lean, user };
  } catch (error) {
    throw error;
  }
};

const getActiveSubscription = async (req) => {
  try {
    const userId = req.userId;

    const [subscription, user] = await Promise.all([
      Subscription.findOne({
        userId,
        status: subscriptionStatusType.ACTIVE,
        expiresAt: { $gt: new Date() },
      })
        .populate("planId", "title price currency durationMonths discountPercentage")
        .sort({ expiresAt: -1 })
        .lean(),
      getPublicUserById(userId),
    ]);

    return { subscription: subscription ?? null, user };
  } catch (error) {
    throw error;
  }
};

export const subscriptionService = {
  purchaseSubscription,
  confirmPayment,
  getAllSubscriptions,
  getSubscriptionById: getSubscriptionByIdService,
  getActiveSubscription,
};
