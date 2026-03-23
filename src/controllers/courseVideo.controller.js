import { courseVideoService } from "../services/courseVideo.service.js";

const addCourseVideo = async (req, res, next) => {
  try {
    const video = await courseVideoService.addCourseVideo(req);
    return res.status(201).json({
      success: true,
      message: "Course video created successfully!",
      video,
    });
  } catch (error) {
    next(error);
  }
};

const getVideosByCourseId = async (req, res, next) => {
  try {
    const videos = await courseVideoService.getVideosByCourseId(req);
    return res.status(200).json({
      success: true,
      message: "Course videos fetched successfully!",
      videos,
    });
  } catch (error) {
    next(error);
  }
};

const getCourseVideoById = async (req, res, next) => {
  try {
    const video = await courseVideoService.getCourseVideoById(req);
    return res.status(200).json({
      success: true,
      message: "Course video fetched successfully!",
      video,
    });
  } catch (error) {
    next(error);
  }
};

const updateCourseVideo = async (req, res, next) => {
  try {
    const video = await courseVideoService.updateCourseVideo(req);
    return res.status(200).json({
      success: true,
      message: "Course video updated successfully!",
      video,
    });
  } catch (error) {
    next(error);
  }
};

const deleteCourseVideo = async (req, res, next) => {
  try {
    const video = await courseVideoService.deleteCourseVideo(req);
    return res.status(200).json({
      success: true,
      message: "Course video deleted successfully!",
      video,
    });
  } catch (error) {
    next(error);
  }
};

export const courseVideoController = {
  addCourseVideo,
  getVideosByCourseId,
  getCourseVideoById,
  updateCourseVideo,
  deleteCourseVideo,
};
