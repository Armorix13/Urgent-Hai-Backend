import Video from "../models/videoTutorial.model.js";

// Add a new video
const addVideo = async (req) => {
  try {
    const { title, description, videoUrl } = req.body;

    if (!title || !videoUrl) {
      throw new Error("Title and video URL are required");
    }

    const video = await Video.create({ title, description, videoUrl });
    return video;
  } catch (err) {
    throw err;
  }
};

// Get all videos with optional pagination
const getAllVideos = async (req) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const videos = await Video.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Video.countDocuments();

    return {
      videos,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  } catch (err) {
    throw err;
  }
};

// Get video by ID
const getVideoById = async (req) => {
  try {
    const { id } = req.params;
    const video = await Video.findById(id);

    if (!video) {
      throw new Error("Video not found");
    }

    return video;
  } catch (err) {
    throw err;
  }
};

// Update video
const updateVideo = async (req) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updated = await Video.findByIdAndUpdate(id, updates, { new: true });

    if (!updated) {
      throw new Error("Video not found");
    }

    return updated;
  } catch (err) {
    throw err;
  }
};

// Delete video
const deleteVideo = async (req) => {
  try {
    const { id } = req.params;

    const deleted = await Video.findByIdAndDelete(id);
    if (!deleted) {
      throw new Error("Video not found");
    }

    return deleted;
  } catch (err) {
    throw err;
  }
};

export const videoService = {
  addVideo,
  getAllVideos,
  getVideoById,
  updateVideo,
  deleteVideo,
};
