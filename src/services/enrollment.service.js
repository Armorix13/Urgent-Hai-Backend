import Enrollment from "../models/enrollment.model.js";
import Course from "../models/course.model.js";
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
  try {
    const userId = req.userId;
    const { courseId, transactionId, paymentMethod } = req.body;

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

    const now = new Date();
    const existing = await Enrollment.findOne({ user: userId, course: courseId });
    const stillValid =
      existing &&
      existing.isActive &&
      (existing.expiresAt == null || existing.expiresAt > now);

    if (stillValid) {
      throw new Error("Already enrolled in this course");
    }

    const paymentBlock =
      course.courseType === 1
        ? {
            amount: course.price,
            transactionId: transactionId || null,
            paymentMethod: paymentMethod || null,
            paymentDate: new Date(),
          }
        : undefined;

    let enrollment;
    if (existing) {
      existing.isActive = true;
      existing.expiresAt = null;
      existing.enrollmentType = course.courseType === 1 ? "paid" : "free";
      if (paymentBlock) existing.paymentDetails = paymentBlock;
      await existing.save();
      enrollment = existing;
    } else {
      const enrollmentData = {
        user: userId,
        course: courseId,
        enrollmentType: course.courseType === 1 ? "paid" : "free",
        expiresAt: null,
      };
      if (paymentBlock) enrollmentData.paymentDetails = paymentBlock;
      enrollment = await Enrollment.create(enrollmentData);
      await Course.findByIdAndUpdate(courseId, {
        $inc: { enrollmentCount: 1 },
      });
    }

    const populated = await Enrollment.findById(enrollment._id)
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

const getUserEnrollments = async (req) => {
  try {
    const userId = req.userId;
    let enrollments = await Enrollment.getUserEnrollments(userId);

    const revenueCat = {
      applied: false,
      subscriberFound: null,
      nonSubscriptionProductKeys: [],
    };

    if (process.env.REVENUE_CAT_TOKEN) {
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
          enrollments = filterEnrollmentsByRevenueCatProducts(enrollments, keys);
        }
      } catch (err) {
        revenueCat.applied = false;
        revenueCat.error = err.message || "RevenueCat request failed";
        revenueCat.subscriberFound = null;
      }
    } else {
      revenueCat.reason = "revenuecat_not_configured";
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
