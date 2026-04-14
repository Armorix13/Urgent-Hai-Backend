import { enrollmentService } from "../services/enrollment.service.js";

const enroll = async (req, res, next) => {
  try {
    const enrollment = await enrollmentService.enroll(req);
    return res.status(201).json({
      success: true,
      message: "Enrolled successfully!",
      enrollment,
    });
  } catch (error) {
    next(error);
  }
};

const getUserEnrollments = async (req, res, next) => {
  try {
    const { enrollments } = await enrollmentService.getUserEnrollments(req);
    return res.status(200).json({
      success: true,
      message: "Enrollments fetched successfully!",
      enrollments,
    });
  } catch (error) {
    next(error);
  }
};

const getEnrollmentById = async (req, res, next) => {
  try {
    const enrollment = await enrollmentService.getEnrollmentById(req);
    return res.status(200).json({
      success: true,
      message: "Enrollment fetched successfully!",
      enrollment,
    });
  } catch (error) {
    next(error);
  }
};

const updateProgress = async (req, res, next) => {
  try {
    const enrollment = await enrollmentService.updateProgress(req);
    return res.status(200).json({
      success: true,
      message: "Progress updated successfully!",
      enrollment,
    });
  } catch (error) {
    next(error);
  }
};

const cancelEnrollment = async (req, res, next) => {
  try {
    const enrollment = await enrollmentService.cancelEnrollment(req);
    return res.status(200).json({
      success: true,
      message: "Enrollment cancelled successfully!",
      enrollment,
    });
  } catch (error) {
    next(error);
  }
};

export const enrollmentController = {
  enroll,
  getUserEnrollments,
  getEnrollmentById,
  updateProgress,
  cancelEnrollment,
};
