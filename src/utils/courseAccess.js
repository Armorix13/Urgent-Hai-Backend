import Subscription from "../models/subscription.model.js";
import Enrollment from "../models/enrollment.model.js";
import { subscriptionStatusType, roleType } from "./enum.js";

/** Full access for course list/detail, similar, and enrollment payloads (videos unredacted). */
export const FULL_LISTING_ACCESS = Object.freeze({
  canWatchFull: true,
  reason: "listing",
});

export async function userHasActiveSubscription(userId) {
  if (!userId) return false;
  const sub = await Subscription.findOne({
    userId,
    status: subscriptionStatusType.ACTIVE,
    expiresAt: { $gt: new Date() },
  })
    .select("_id")
    .lean();
  return !!sub;
}

/** Active enrollment: lifetime (expiresAt null) or not yet expired */
export function enrollmentActiveMatch() {
  const now = new Date();
  return {
    isActive: true,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
  };
}

export async function getPurchasedCourseIds(userId, courseIds) {
  if (!userId || !courseIds?.length) return new Set();
  const rows = await Enrollment.find({
    user: userId,
    course: { $in: courseIds },
    ...enrollmentActiveMatch(),
  })
    .select("course")
    .lean();
  return new Set(rows.map((r) => r.course.toString()));
}

/**
 * @param course — lean { _id, courseType }
 * @returns {{ canWatchFull: boolean, reason: string }}
 */
export function computeCourseWatchAccess(course, {
  userId,
  hasSubscription,
  purchasedCourseIds,
  isAdmin,
}) {
  if (isAdmin) {
    return { canWatchFull: true, reason: "admin" };
  }
  if (!userId) {
    return { canWatchFull: false, reason: "login_required" };
  }
  if (hasSubscription) {
    return { canWatchFull: true, reason: "subscription" };
  }
  if (Number(course.courseType) === 2) {
    return { canWatchFull: true, reason: "free_course" };
  }
  const id = course._id?.toString?.() ?? String(course._id);
  if (purchasedCourseIds?.has(id)) {
    return { canWatchFull: true, reason: "purchased" };
  }
  return { canWatchFull: false, reason: "purchase_required" };
}

export function redactVideos(videos, canWatchFull) {
  if (!videos?.length || canWatchFull) return videos;
  return videos.map((v) => ({
    ...v,
    videoUrl: null,
    locked: true,
  }));
}

export function redactCourseContentEmbedded(items, canWatchFull) {
  if (!items?.length || canWatchFull) return items;
  return items.map((c) => ({
    ...c,
    videoUrl: null,
    locked: true,
  }));
}

export function applyWatchPolicyToCourse(course, access) {
  const { canWatchFull, reason } = access;
  const videos = redactVideos(course.videos, canWatchFull);
  const fullCount = Array.isArray(videos) ? videos.length : 0;
  const courseContent = redactCourseContentEmbedded(
    course.courseContent,
    canWatchFull
  );
  return {
    ...course,
    videos,
    courseContent,
    videoCount: fullCount,
    videosCount: fullCount,
    access: {
      canWatchFull,
      reason,
      requiresLogin: !canWatchFull && reason === "login_required",
      requiresSubscriptionOrPurchase:
        Number(course.courseType) === 1 &&
        !canWatchFull &&
        reason !== "login_required",
    },
  };
}

export function isAdminRole(userRole) {
  return userRole === roleType.ADMIN;
}

/** Shared by course + courseVideo services */
export async function buildWatchContext(req, courseIds) {
  const userId = req.userId || null;
  const isAdmin = isAdminRole(req.userRole);
  if (!userId) {
    return {
      userId: null,
      hasSubscription: false,
      purchasedSet: new Set(),
      isAdmin: false,
    };
  }
  const hasSubscription = await userHasActiveSubscription(userId);
  const purchasedSet = await getPurchasedCourseIds(userId, courseIds);
  return { userId, hasSubscription, purchasedSet, isAdmin };
}
