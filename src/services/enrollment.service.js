import Enrollment from "../models/enrollment.model.js";
import Course from "../models/course.model.js";
import User from "../models/user.model.js";
import {
  attachVideosToCourseLean,
  fetchVideosForCourse,
  fetchVideosGroupedByCourseIds,
} from "../utils/courseVideo.util.js";
import {
  applyWatchPolicyToCourse,
  FULL_LISTING_ACCESS,
} from "../utils/courseAccess.js";
import { attachMyRatingsToEnrollments } from "./rating.service.js";
import {
  fetchRevenueCatSubscriber,
  extractNonSubscriptionProductKeys,
  filterEnrollmentsByRevenueCatProducts,
} from "./revenueCat.service.js";

const enrichCourseWithVideosAndAccess = (course, videos) =>
  applyWatchPolicyToCourse(attachVideosToCourseLean(course, videos), FULL_LISTING_ACCESS);

const enrichEnrollmentWithVideos = async (enrollment, userId) => {
  if (!enrollment?.course?._id) return enrollment;
  const videos = await fetchVideosForCourse(enrollment.course._id);
  let out = {
    ...enrollment,
    course: enrichCourseWithVideosAndAccess(enrollment.course, videos),
  };
  if (userId) {
    const [withRating] = await attachMyRatingsToEnrollments([out], userId);
    out = withRating;
  } else {
    out = { ...out, myRating: null };
  }
  return out;
};

/**
 * Parses productIds and/or product_ids from query (comma-separated and/or repeated params).
 * Examples: ?productIds=vocal_course,abc_product  ?productIds=a&productIds=b  ?product_ids=x
 */
function parseProductIdsFromQuery(query) {
  if (!query || typeof query !== "object") return new Set();
  const parts = [];
  const pull = (v) => {
    if (v == null) return;
    if (Array.isArray(v)) {
      v.forEach((item) => pull(item));
      return;
    }
    const s = String(v).trim();
    if (!s) return;
    s.split(",").forEach((piece) => {
      const t = piece.trim();
      if (t) parts.push(t);
    });
  };
  pull(query.productIds);
  pull(query.product_ids);
  return new Set(parts);
}

/** Active courses whose identifierId matches requested product ids (case-insensitive). */
async function fetchActiveCoursesByProductIdentifiers(productIdSet) {
  const wantLower = [...productIdSet].map((p) => String(p).trim().toLowerCase());
  if (!wantLower.length) return [];
  return Course.find({
    // isDeleted: false,
    // isActive: true,
    identifierId: { $exists: true, $nin: [null, ""] },
    $expr: {
      $in: [{ $toLower: "$identifierId" }, wantLower],
    },
  })
    .select(
      "title identifierId description thumbnail duration level category courseType price courseContent isDeleted tags benefits prerequisites learningOutcomes isActive rating enrollmentCount createdAt updatedAt"
    )
    .lean();
}

function sortCoursesByRequestedOrder(courses, productIdSet) {
  const order = [...productIdSet].map((p) => String(p).trim().toLowerCase());
  const rank = (identifierId) => {
    const i = order.indexOf(String(identifierId).trim().toLowerCase());
    return i === -1 ? 999 : i;
  };
  return [...courses].sort((a, b) => rank(a.identifierId) - rank(b.identifierId));
}

/**
 * Build one row per matching course from the Course model: real enrollment if present,
 * otherwise a catalog-only row (isEnrolled: false) so RevenueCat / productIds still surface the course.
 */
async function buildEnrollmentListFromCatalog(userId, productIdSet) {
  let courses = await fetchActiveCoursesByProductIdentifiers(productIdSet);
  courses = sortCoursesByRequestedOrder(courses, productIdSet);
  if (!courses.length) return [];

  const courseIds = courses.map((c) => c._id);
  const enrollmentRows = await Enrollment.find({
    user: userId,
    course: { $in: courseIds },
    isActive: true,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  }).lean();

  const byCourse = new Map(enrollmentRows.map((e) => [e.course.toString(), e]));

  return courses.map((course) => {
    const e = byCourse.get(course._id.toString());
    if (e) {
      return { ...e, course, isEnrolled: true };
    }
    // No Enrollment document — omit _id/timestamps so clients don't treat null as a valid id
    return {
      user: userId,
      course,
      enrolledAt: null,
      expiresAt: null,
      isActive: true,
      isEnrolled: false,
      catalogOnly: true,
      progress: {
        completedLessonOrders: [],
        lastAccessedAt: new Date(),
        completionPercentage: 0,
      },
    };
  });
}

const enrichEnrollmentsListWithVideos = async (enrollments, userId) => {
  if (!enrollments?.length) return enrollments;
  const ids = enrollments.map((e) => e.course?._id).filter(Boolean);
  if (!ids.length) return attachMyRatingsToEnrollments(enrollments, userId);
  const grouped = await fetchVideosGroupedByCourseIds(ids);
  let list = enrollments.map((e) => {
    if (!e.course?._id) return { ...e, myRating: null };
    const videos = grouped.get(e.course._id.toString()) ?? [];
    return {
      ...e,
      course: enrichCourseWithVideosAndAccess(e.course, videos),
    };
  });
  return attachMyRatingsToEnrollments(list, userId);
};

const enroll = async (req) => {
  const userId = req.userId;
  const { courseId, transactionId, paymentMethod } = req.body;
  let walletDeducted = 0;
  let enrollmentPersisted = false;

  try {
    const course = await Course.findById(courseId);
    if (!course) {
      throw new Error("Course not found");
    }

    if (course.isDeleted) {
      throw new Error("Course is not available");
    }

    if (!course.isActive) {
      throw new Error("Course is not available for enrollment");
    }

    const isPaidCourse = course.courseType === 1;
    const price = isPaidCourse ? Math.max(0, Number(course.price) || 0) : 0;

    const now = new Date();
    const existing = await Enrollment.findOne({ user: userId, course: courseId });
    const stillValid =
      existing &&
      existing.isActive &&
      (existing.expiresAt == null || existing.expiresAt > now);

    if (stillValid) {
      throw new Error("Already enrolled in this course");
    }

    if (isPaidCourse && price > 0) {
      const updated = await User.findOneAndUpdate(
        {
          _id: userId,
          $expr: {
            $gte: [{ $ifNull: ["$wallet", 0] }, price],
          },
        },
        { $inc: { wallet: -price } },
        { new: true, select: "wallet" }
      ).lean();

      if (!updated) {
        const u = await User.findById(userId).select("wallet").lean();
        const available = Number(u?.wallet ?? 0);
        throw new Error(
          `Insufficient wallet balance for enrollment. Required: ${price}, available: ${available}.`
        );
      }
      walletDeducted = price;
    }

    const paymentBlock =
      isPaidCourse
        ? {
            amount: course.price,
            transactionId: transactionId || "wallet",
            paymentMethod: paymentMethod || "wallet",
            paymentDate: new Date(),
          }
        : undefined;

    let enrollment;
    if (existing) {
      existing.isActive = true;
      existing.expiresAt = null;
      existing.enrollmentType = isPaidCourse ? "paid" : "free";
      if (paymentBlock) existing.paymentDetails = paymentBlock;
      await existing.save();
      enrollment = existing;
    } else {
      const enrollmentData = {
        user: userId,
        course: courseId,
        enrollmentType: isPaidCourse ? "paid" : "free",
        expiresAt: null,
      };
      if (paymentBlock) enrollmentData.paymentDetails = paymentBlock;
      enrollment = await Enrollment.create(enrollmentData);
      await Course.findByIdAndUpdate(courseId, {
        $inc: { enrollmentCount: 1 },
      });
    }

    enrollmentPersisted = true;

    const populated = await Enrollment.findById(enrollment._id)
      .populate(
        "course",
        "title identifierId description thumbnail duration level category courseType price courseContent tags benefits prerequisites learningOutcomes"
      )
      .lean();

    return enrichEnrollmentWithVideos(populated, userId);
  } catch (err) {
    if (walletDeducted > 0 && !enrollmentPersisted) {
      await User.findByIdAndUpdate(userId, {
        $inc: { wallet: walletDeducted },
      }).catch(() => {});
    }
    throw err;
  }
};

const getUserEnrollments = async (req) => {
  try {
    const userId = req.userId;
    let enrollments;

    const productIdSet = parseProductIdsFromQuery(req.query);

    const revenueCat = {
      applied: false,
      subscriberFound: null,
      nonSubscriptionProductKeys: [],
      mode: "none",
      requestedProductIds: [],
    };

    if (productIdSet.size > 0) {
      revenueCat.mode = "product_ids_query";
      revenueCat.applied = true;
      revenueCat.requestedProductIds = [...productIdSet];
      enrollments = await buildEnrollmentListFromCatalog(userId, productIdSet);
      revenueCat.catalogCoursesFound = enrollments.length;
      revenueCat.catalogOnlyCount = enrollments.filter((e) => e.catalogOnly).length;

      if (process.env.REVENUE_CAT_TOKEN) {
        try {
          const rcJson = await fetchRevenueCatSubscriber(userId);
          if (rcJson === null) {
            revenueCat.subscriberFound = false;
            revenueCat.nonSubscriptionProductKeys = [];
          } else {
            if (rcJson.request_date) revenueCat.requestDate = rcJson.request_date;
            revenueCat.subscriberFound = true;
            revenueCat.nonSubscriptionProductKeys = [
              ...extractNonSubscriptionProductKeys(rcJson),
            ];
          }
        } catch (err) {
          revenueCat.revenueCatError = err.message || "RevenueCat request failed";
          revenueCat.subscriberFound = null;
        }
      } else {
        revenueCat.reason = "revenuecat_not_configured";
      }
    } else {
      enrollments = await Enrollment.getUserEnrollments(userId);
      if (process.env.REVENUE_CAT_TOKEN) {
        revenueCat.mode = "revenuecat_non_subscriptions";
        try {
          const rcJson = await fetchRevenueCatSubscriber(userId);
          if (rcJson === null) {
            revenueCat.subscriberFound = false;
            revenueCat.applied = true;
            revenueCat.nonSubscriptionProductKeys = [];
            enrollments = filterEnrollmentsByRevenueCatProducts(
              enrollments,
              new Set()
            );
          } else {
            if (rcJson.request_date) revenueCat.requestDate = rcJson.request_date;
            const keys = extractNonSubscriptionProductKeys(rcJson);
            revenueCat.subscriberFound = true;
            revenueCat.applied = true;
            revenueCat.nonSubscriptionProductKeys = [...keys];
            enrollments = filterEnrollmentsByRevenueCatProducts(
              enrollments,
              keys
            );
          }
        } catch (err) {
          revenueCat.applied = false;
          revenueCat.error = err.message || "RevenueCat request failed";
          revenueCat.subscriberFound = null;
        }
      } else {
        revenueCat.reason = "revenuecat_not_configured";
      }
    }

    const list = await enrichEnrollmentsListWithVideos(enrollments, userId);
    return { enrollments: list, revenueCat };
  } catch (err) {
    throw err;
  }
};

const getEnrollmentById = async (req) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const enrollment = await Enrollment.findById(id)
      .populate(
        "course",
        "title identifierId description thumbnail duration level category courseType price courseContent tags benefits prerequisites learningOutcomes"
      )
      .lean();

    if (!enrollment) {
      throw new Error("Enrollment not found");
    }

    if (enrollment.user.toString() !== userId) {
      throw new Error("Unauthorized to view this enrollment");
    }

    return enrichEnrollmentWithVideos(enrollment, userId);
  } catch (err) {
    throw err;
  }
};

const updateProgress = async (req) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { completedLessonOrders, completionPercentage } = req.body;

    const enrollment = await Enrollment.findById(id);

    if (!enrollment) {
      throw new Error("Enrollment not found");
    }

    if (enrollment.user.toString() !== userId) {
      throw new Error("Unauthorized to update this enrollment");
    }

    if (completedLessonOrders !== undefined) {
      enrollment.progress.completedLessonOrders = completedLessonOrders;
    }
    if (completionPercentage !== undefined) {
      enrollment.progress.completionPercentage = completionPercentage;
    }
    enrollment.progress.lastAccessedAt = new Date();

    await enrollment.save();

    const populated = await Enrollment.findById(id)
      .populate(
        "course",
        "title identifierId description thumbnail duration level category courseType price courseContent tags benefits prerequisites learningOutcomes"
      )
      .lean();

    return enrichEnrollmentWithVideos(populated, userId);
  } catch (err) {
    throw err;
  }
};

const cancelEnrollment = async (req) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const enrollment = await Enrollment.findById(id);

    if (!enrollment) {
      throw new Error("Enrollment not found");
    }

    if (enrollment.user.toString() !== userId) {
      throw new Error("Unauthorized to cancel this enrollment");
    }

    enrollment.isActive = false;
    await enrollment.save();

    return enrollment;
  } catch (err) {
    throw err;
  }
};

export const enrollmentService = {
  enroll,
  getUserEnrollments,
  getEnrollmentById,
  updateProgress,
  cancelEnrollment,
};
