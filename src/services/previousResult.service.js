import PreviousResult from "../models/previousResult.model.js";

const addPreviousResult = async (req) => {
  try {
    const { title, description, videoUrl } = req.body;

    if (!title || !videoUrl) {
      throw new Error("Title and video URL are required");
    }

    const previousResult = await PreviousResult.create({
      title,
      description,
      videoUrl,
    });
    return previousResult;
  } catch (err) {
    throw err;
  }
};

const getAllPreviousResults = async (req) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const previousResults = await PreviousResult.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await PreviousResult.countDocuments();

    return {
      previousResults,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  } catch (err) {
    throw err;
  }
};

const getPreviousResultById = async (req) => {
  try {
    const { id } = req.params;
    const previousResult = await PreviousResult.findById(id);

    if (!previousResult) {
      throw new Error("Previous result not found");
    }

    return previousResult;
  } catch (err) {
    throw err;
  }
};

const updatePreviousResult = async (req) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const previousResult = await PreviousResult.findByIdAndUpdate(id, updates, {
      new: true,
    });

    if (!previousResult) {
      throw new Error("Previous result not found");
    }

    return previousResult;
  } catch (err) {
    throw err;
  }
};

const deletePreviousResult = async (req) => {
  try {
    const { id } = req.params;

    const previousResult = await PreviousResult.findByIdAndDelete(id);
    if (!previousResult) {
      throw new Error("Previous result not found");
    }

    return previousResult;
  } catch (err) {
    throw err;
  }
};

export const previousResultService = {
  addPreviousResult,
  getAllPreviousResults,
  getPreviousResultById,
  updatePreviousResult,
  deletePreviousResult,
};
