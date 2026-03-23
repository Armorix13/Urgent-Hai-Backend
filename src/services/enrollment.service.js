import Enrollment from "../models/enrollment.model.js";
import Course from "../models/course.model.js";

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

    const existing = await Enrollment.findOne({ user: userId, course: courseId });
    if (existing && existing.isActive) {
      throw new Error("Already enrolled in this course");
    }

    const enrollmentData = {
      user: userId,
      course: courseId,
      enrollmentType: course.courseType === 1 ? "paid" : "free",
    };

    if (course.courseType === 1) {
      enrollmentData.paymentDetails = {
        amount: course.price,
        transactionId: transactionId || null,
        paymentMethod: paymentMethod || null,
        paymentDate: new Date(),
      };
    }

    const enrollment = await Enrollment.create(enrollmentData);

    await Course.findByIdAndUpdate(courseId, {
      $inc: { enrollmentCount: 1 },
    });

    const populated = await Enrollment.findById(enrollment._id)
      .populate("course", "title description thumbnail duration level category courseType price courseContent")
      .lean();

    return populated;
  } catch (err) {
    throw err;
  }
};

const getUserEnrollments = async (req) => {
  try {
    const userId = req.userId;
    const enrollments = await Enrollment.getUserEnrollments(userId);
    return enrollments;
  } catch (err) {
    throw err;
  }
};

const getEnrollmentById = async (req) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const enrollment = await Enrollment.findById(id)
      .populate("course", "title description thumbnail duration level category courseType price courseContent")
      .lean();

    if (!enrollment) {
      throw new Error("Enrollment not found");
    }

    if (enrollment.user.toString() !== userId) {
      throw new Error("Unauthorized to view this enrollment");
    }

    return enrollment;
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
      .populate("course", "title description thumbnail duration level category courseType price courseContent")
      .lean();

    return populated;
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
