import RaagDetail from "../models/raagDetail.model.js";
import Raag from "../models/raag.model.js";
import mongoose from "mongoose";

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

// Update RaagDetail by ID (supports numeric Raag.id, Raag _id, OR RaagDetail _id)
const updateRaagDetail = async (req) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    let detail = null;

    // 1. Check if ID is a custom numeric Raag id (e.g. 1, 2)
    if (id && !isNaN(id) && id.trim() !== "") {
      const numericId = Number(id);
      const raag = await Raag.findOne({ id: numericId });
      if (raag) {
        detail = await RaagDetail.findOne({ raag: raag._id });
      }
    }

    // 2. If not found, and it is a valid ObjectId, search by ObjectId
    if (!detail && id && mongoose.Types.ObjectId.isValid(id)) {
      // Could be RaagDetail's own _id
      detail = await RaagDetail.findById(id);

      // If not found, could be Raag's _id referenced inside RaagDetail
      if (!detail) {
        detail = await RaagDetail.findOne({ raag: id });
      }

      // If still not found, could be that Raag document exists under this ObjectId but detail lookup is required
      if (!detail) {
        const raag = await Raag.findById(id);
        if (raag) {
          detail = await RaagDetail.findOne({ raag: raag._id });
        }
      }
    }

    if (!detail) {
      throw new Error("RaagDetail not found");
    }

    // If 'name' is provided in the updates, update the referenced Raag's name as well
    if (updates.name && detail.raag) {
      await Raag.findByIdAndUpdate(detail.raag, { name: updates.name });
    }

    // Now update the RaagDetail document
    const updated = await RaagDetail.findByIdAndUpdate(detail._id, updates, {
      new: true,
    }).populate("raag", "name id");

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
