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

// Get all videos with optional pagination — random order on every request (discovery feed).
const getAllVideos = async (req) => {
  try {
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 10, 1),
      100
    );
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const total = await Video.countDocuments();

    if (total === 0) {
      return {
        videos: [],
        total: 0,
        page,
        totalPages: 0,
      };
    }

    // $sample draws without replacement up to `sampleSize`. Each API call gets a new random draw.
    const sampleSize = Math.min(total, limit * page);
    const sampled = await Video.aggregate([{ $sample: { size: sampleSize } }]);

    const videos = sampled.slice((page - 1) * limit, page * limit);
    const totalPages = Math.ceil(total / limit);

    return {
      videos,
      total,
      page,
      totalPages,
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
