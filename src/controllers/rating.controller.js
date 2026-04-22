import {
  deleteReviewByCollaborator,
  getCollaboratorRatingOverview,
  listCollaboratorCoursesForRatings,
  listReviewsForCollaboratorCourse,
  upsertCourseRating,
} from "../services/rating.service.js";

const submitRating = async (req, res, next) => {
  try {
    const data = await upsertCourseRating(req);
    return res.status(200).json({
      success: true,
      message: "Rating saved successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const collaboratorOverview = async (req, res, next) => {
  try {
    const data = await getCollaboratorRatingOverview(req);
    return res.status(200).json({
      success: true,
      message: "Rating overview loaded",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const collaboratorCourses = async (req, res, next) => {
  try {
    const data = await listCollaboratorCoursesForRatings(req);
    return res.status(200).json({
      success: true,
      message: "Courses loaded",
      ...data,
    });
  } catch (error) {
    next(error);
  }
};

const collaboratorCourseReviews = async (req, res, next) => {
  try {
    const data = await listReviewsForCollaboratorCourse(req);
    return res.status(200).json({
      success: true,
      message: "Reviews loaded",
      ...data,
    });
  } catch (error) {
    next(error);
  }
};

const collaboratorDeleteReview = async (req, res, next) => {
  try {
    const data = await deleteReviewByCollaborator(req);
    return res.status(200).json({
      success: true,
      message: "Review removed",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const ratingController = {
  submitRating,
  collaboratorOverview,
  collaboratorCourses,
  collaboratorCourseReviews,
  collaboratorDeleteReview,
};
