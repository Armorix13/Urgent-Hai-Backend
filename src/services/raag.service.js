import RaagModel from "../models/Raag.model.js";
import RaagDetailModel from "../models/RaagDetail.model.js";

// Add a new Raag
const addRaag = async (req) => {
  try {
    const { id, name } = req.body;

    const raag = await RaagModel.create({
      id,
      name,
    });

    return raag;
  } catch (error) {
    throw error;
  }
};

const getAllRaags = async (req) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;

    const raags = await RaagModel.find()
      .sort({ id: 1 }) // Sort ascending by id
      .skip(skip)
      .limit(limit);

    const total = await RaagModel.countDocuments();

    return {
      raags,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    throw error;
  }
};

// Get Raag by ID
const getRaagById = async (req) => {
  try {
    const { id } = req.params;

    const raag = await RaagModel.findById(id).lean(); // lean() returns plain JS object

    if (!raag) {
      throw new Error("Raag not found");
    }

    const detail = await RaagDetailModel.findOne({ raag: raag._id }).lean();

    // Merge detail fields into raag object
    if (detail) {
      delete detail._id;
      delete detail.raag;
      delete detail.createdAt;
      delete detail.updatedAt;
      delete detail.__v;

      Object.assign(raag, detail);
    }

    return raag;
  } catch (error) {
    throw error;
  }
};

// Update Raag by ID
const updateRaag = async (req) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updated = await RaagModel.findOneAndUpdate(
      { id: Number(id) },
      updates,
      { new: true }
    );

    if (!updated) {
      throw new Error("Raag not found");
    }

    return updated;
  } catch (error) {
    throw error;
  }
};

// Delete Raag by ID
const deleteRaag = async (req) => {
  try {
    const { id } = req.params;

    const deleted = await RaagModel.findOneAndDelete({ id: Number(id) });

    if (!deleted) {
      throw new Error("Raag not found");
    }

    return deleted;
  } catch (error) {
    throw error;
  }
};

export const raagService = {
  addRaag,
  getAllRaags,
  getRaagById,
  updateRaag,
  deleteRaag,
};
