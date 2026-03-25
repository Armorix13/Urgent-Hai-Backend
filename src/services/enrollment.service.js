import Enrollment from "../models/enrollment.model.js";
import Course from "../models/course.model.js";
import {
  attachVideosToCourseLean,
  fetchVideosForCourse,
  fetchVideosGroupedByCourseIds,
} from "../utils/courseVideo.util.js";

const enrichEnrollmentWithVideos = async (enrollment) => {
  if (!enrollment?.course?._id) return enrollment;
  const videos = await fetchVideosForCourse(enrollment.course._id);
  return {
    ...enrollment,
    course: attachVideosToCourseLean(enrollment.course, videos),
  };
};

const enrichEnrollmentsListWithVideos = async (enrollments) => {
  if (!enrollments?.length) return enrollments;
  const ids = enrollments.map((e) => e.course?._id).filter(Boolean);
  if (!ids.length) return enrollments;
  const grouped = await fetchVideosGroupedByCourseIds(ids);
  return enrollments.map((e) => {
    if (!e.course?._id) return e;
    const videos = grouped.get(e.course._id.toString()) ?? [];
    return {
      ...e,
      course: attachVideosToCourseLean(e.course, videos),
    };
  });
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
        "title description thumbnail duration level category courseType price courseContent tags benefits prerequisites learningOutcomes"
      )
      .lean();

    return enrichEnrollmentWithVideos(populated);
  } catch (err) {
    throw err;
  }
};

const getUserEnrollments = async (req) => {
  try {
    const userId = req.userId;
    const enrollments = await Enrollment.getUserEnrollments(userId);
    return enrichEnrollmentsListWithVideos(enrollments);
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
        "title description thumbnail duration level category courseType price courseContent tags benefits prerequisites learningOutcomes"
      )
      .lean();

    if (!enrollment) {
      throw new Error("Enrollment not found");
    }

    if (enrollment.user.toString() !== userId) {
      throw new Error("Unauthorized to view this enrollment");
    }

    return enrichEnrollmentWithVideos(enrollment);
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
        "title description thumbnail duration level category courseType price courseContent tags benefits prerequisites learningOutcomes"
      )
      .lean();

    return enrichEnrollmentWithVideos(populated);
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
