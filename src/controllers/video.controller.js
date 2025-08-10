import { videoService } from "../services/video.service.js";

const addVideo = async (req, res, next) => {
  try {
    const video = await videoService.addVideo(req);
    return res.status(201).json({
      success: true,
      message: "Video created successfully!",
      video,
    });
  } catch (error) {
    next(error);
  }
};

const getAllVideos = async (req, res, next) => {
  try {
    const data = await videoService.getAllVideos(req);
    return res.status(200).json({
      success: true,
      message: "Videos fetched successfully!",
      ...data,
    });
  } catch (error) {
    next(error);
  }
};

const getVideoById = async (req, res, next) => {
  try {
    const video = await videoService.getVideoById(req);
    return res.status(200).json({
      success: true,
      message: "Video fetched successfully!",
      video,
    });
  } catch (error) {
    next(error);
  }
};

const updateVideo = async (req, res, next) => {
  try {
    const video = await videoService.updateVideo(req);
    return res.status(200).json({
      success: true,
      message: "Video updated successfully!",
      video,
    });
  } catch (error) {
    next(error);
  }
};

const deleteVideo = async (req, res, next) => {
  try {
    const video = await videoService.deleteVideo(req);
    return res.status(200).json({
      success: true,
      message: "Video deleted successfully!",
      video,
    });
  } catch (error) {
    next(error);
  }
};

export const videoController = {
  addVideo,
  getAllVideos,
  getVideoById,
  updateVideo,
  deleteVideo,
};
