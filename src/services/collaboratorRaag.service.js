import mongoose from "mongoose";
import Raag from "../models/raag.model.js";
import RaagDetailModel from "../models/raagDetail.model.js";

/** Retrieve all Raags and their details */
export const getAllRaags = async () => {
  const raags = await Raag.find().sort({ createdAt: -1 }).lean();
  const results = [];
  for (const raag of raags) {
    const details = await RaagDetailModel.findOne({ raag: raag._id }).lean();
    results.push({
      ...raag,
      details: details || null,
    });
  }
  return results;
};

/** Retrieve single Raag and details */
export const getRaagById = async (id) => {
  const raag = await Raag.findById(id).lean();
  if (!raag) {
    const err = new Error("Raag not found");
    err.statusCode = 404;
    throw err;
  }
  const details = await RaagDetailModel.findOne({ raag: raag._id }).lean();
  return {
    ...raag,
    details: details || null,
  };
};

/** Create Raag and RaagDetail */
export const createRaag = async (data) => {
  const { name, ...detailFields } = data;
  if (!name || String(name).trim() === "") {
    const err = new Error("Raag name is required");
    err.statusCode = 400;
    throw err;
  }

  // Find next custom numeric ID
  const lastRaag = await Raag.findOne().sort({ id: -1 });
  const nextId = lastRaag && typeof lastRaag.id === "number" ? lastRaag.id + 1 : 1;

  // Create parent Raag
  const raag = new Raag({
    id: nextId,
    name: String(name).trim(),
  });
  await raag.save();

  // Create child RaagDetail
  const raagDetail = new RaagDetailModel({
    raag: raag._id,
    ...detailFields,
  });
  await raagDetail.save();

  return {
    ...raag.toObject(),
    details: raagDetail.toObject(),
  };
};

/** Update Raag and RaagDetail */
export const updateRaag = async (id, data) => {
  const { name, ...detailFields } = data;
  const raag = await Raag.findById(id);
  if (!raag) {
    const err = new Error("Raag not found");
    err.statusCode = 404;
    throw err;
  }

  if (name !== undefined) {
    raag.name = String(name).trim();
    await raag.save();
  }

  let raagDetail = await RaagDetailModel.findOne({ raag: raag._id });
  if (!raagDetail) {
    raagDetail = new RaagDetailModel({
      raag: raag._id,
    });
  }

  // Update properties on raagDetail
  const fields = [
    "sur", "thaat", "wargitSur", "jaati", "time", 
    "vaadi", "samvadi", "aroh", "avroh", "audioUrl", "listOfBandish"
  ];
  for (const field of fields) {
    if (detailFields[field] !== undefined) {
      raagDetail[field] = detailFields[field];
    }
  }

  await raagDetail.save();

  return {
    ...raag.toObject(),
    details: raagDetail.toObject(),
  };
};

/** Delete Raag and child RaagDetail */
export const deleteRaag = async (id) => {
  const raag = await Raag.findById(id);
  if (!raag) {
    const err = new Error("Raag not found");
    err.statusCode = 404;
    throw err;
  }
  await RaagDetailModel.deleteMany({ raag: raag._id });
  await raag.deleteOne();
  return { success: true };
};
