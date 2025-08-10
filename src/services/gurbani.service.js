import Gurbani from "../models/gurbani.model.js";

// Add a new Gurbani
const addGurbani = async (req) => {
  try {
    const { title, description, baanis } = req.body;
    const gurbani = await Gurbani.create({ title, description, baanis });
    return gurbani;
  } catch (err) {
    throw err;
  }
};

// Get all Gurbani with pagination
const getAllGurbani = async (req) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const gurbani = await Gurbani.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Gurbani.countDocuments();

    return {
      gurbani,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  } catch (err) {
    throw err;
  }
};

// Get Gurbani by ID
const getGurbaniById = async (req) => {
  try {
    const { id } = req.params;
    const gurbani = await Gurbani.findById(id);

    if (!gurbani) throw new Error("Gurbani not found");

    return gurbani;
  } catch (err) {
    throw err;
  }
};

// Update Gurbani
const updateGurbani = async (req) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updated = await Gurbani.findByIdAndUpdate(id, updates, { new: true });

    if (!updated) throw new Error("Gurbani not found");

    return updated;
  } catch (err) {
    throw err;
  }
};

// Delete Gurbani
const deleteGurbani = async (req) => {
  try {
    const { id } = req.params;

    const deleted = await Gurbani.findByIdAndDelete(id);
    if (!deleted) throw new Error("Gurbani not found");

    return deleted;
  } catch (err) {
    throw err;
  }
};

// Add Baani to a Gurbani
const addBaani = async (req) => {
  try {
    const { id } = req.params; // Gurbani ID
    const { title, pdfUrl, audioUrl } = req.body;

    const updated = await Gurbani.findByIdAndUpdate(
      id,
      { $push: { baanis: { title, pdfUrl, audioUrl } } },
      { new: true }
    );

    if (!updated) throw new Error("Gurbani not found");

    return updated;
  } catch (err) {
    throw err;
  }
};

// Update Baani inside a Gurbani
const updateBaani = async (req) => {
  try {
    const { id, baaniId } = req.params;
    const updates = req.body;

    const updated = await Gurbani.updateOne(
      { _id: id, "baanis._id": baaniId },
      {
        $set: {
          "baanis.$.title": updates.title,
          "baanis.$.pdfUrl": updates.pdfUrl,
          "baanis.$.audioUrl": updates.audioUrl,
        },
      }
    );

    if (updated.modifiedCount === 0) throw new Error("Baani not found");

    return await Gurbani.findById(id);
  } catch (err) {
    throw err;
  }
};

// Delete Baani from a Gurbani
const deleteBaani = async (req) => {
  try {
    const { id, baaniId } = req.params;

    const updated = await Gurbani.findByIdAndUpdate(
      id,
      { $pull: { baanis: { _id: baaniId } } },
      { new: true }
    );

    if (!updated) throw new Error("Baani not found");

    return updated;
  } catch (err) {
    throw err;
  }
};

export const gurbaniService = {
  addGurbani,
  getAllGurbani,
  getGurbaniById,
  updateGurbani,
  deleteGurbani,
  addBaani,
  updateBaani,
  deleteBaani,
};
