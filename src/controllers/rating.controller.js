import { upsertCourseRating } from "../services/rating.service.js";

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

export const ratingController = {
  submitRating,
};
