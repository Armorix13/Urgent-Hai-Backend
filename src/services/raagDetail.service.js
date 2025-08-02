import RaagDetail from "../models/raagDetail.model.js";

const addRaagDetail = async (req) => {
  try {
    const {
      raag,
      sur,
      thaat,
      wargitSur,
      jaati,
      time,
      vaadi,
      samvadi,
      aroh,
      avroh,
      audioUrl,
      listOfBandish,
    } = req.body;

    const newDetail = await RaagDetail.create({
      raag,
      sur,
      thaat,
      wargitSur,
      jaati,
      time,
      vaadi,
      samvadi,
      aroh,
      avroh,
      audioUrl,
      listOfBandish,
    });

    return newDetail;
  } catch (error) {
    throw error;
  }
};

// Get all RaagDetails
const getAllRaagDetails = async (req) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const details = await RaagDetail.find()
      .populate("raag", "name id")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await RaagDetail.countDocuments();

    return {
      details,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    throw error;
  }
};

// Get RaagDetail by ID
const getRaagDetailById = async (req) => {
  try {
    const { id } = req.params;
    const detail = await RaagDetail.findById(id).populate("raag", "name id");

    if (!detail) throw new Error("RaagDetail not found");

    return detail;
  } catch (error) {
    throw error;
  }
};

// Update RaagDetail by ID
const updateRaagDetail = async (req) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updated = await RaagDetail.findByIdAndUpdate(id, updates, {
      new: true,
    }).populate("raag", "name id");

    if (!updated) throw new Error("RaagDetail not found");

    return updated;
  } catch (error) {
    throw error;
  }
};

// Delete RaagDetail by ID
const deleteRaagDetail = async (req) => {
  try {
    const { id } = req.params;

    const deleted = await RaagDetail.findByIdAndDelete(id);
    if (!deleted) throw new Error("RaagDetail not found");

    return deleted;
  } catch (error) {
    throw error;
  }
};

export const raagDetailService = {
  addRaagDetail,
  getAllRaagDetails,
  getRaagDetailById,
  updateRaagDetail,
  deleteRaagDetail,
};
