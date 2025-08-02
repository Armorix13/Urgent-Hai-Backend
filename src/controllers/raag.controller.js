import { raagService } from "../services/raag.service.js";

const addRaag = async (req, res, next) => {
  try {
    const raag = await raagService.addRaag(req);
    return res.status(201).json({
      success: true,
      message: "Raag created successfully!",
      raag,
    });
  } catch (error) {
    next(error);
  }
};

const getAllRaags = async (req, res, next) => {
  try {
    const data = await raagService.getAllRaags(req);
    return res.status(200).json({
      success: true,
      message: "Raags fetched successfully!",
      ...data,
    });
  } catch (error) {
    next(error);
  }
};

const getRaagById = async (req, res, next) => {
  try {
    const raag = await raagService.getRaagById(req);
    return res.status(200).json({
      success: true,
      message: "Raag fetched successfully!",
      raag,
    });
  } catch (error) {
    next(error);
  }
};

const updateRaag = async (req, res, next) => {
  try {
    const raag = await raagService.updateRaag(req);
    return res.status(200).json({
      success: true,
      message: "Raag updated successfully!",
      raag,
    });
  } catch (error) {
    next(error);
  }
};

const deleteRaag = async (req, res, next) => {
  try {
    const raag = await raagService.deleteRaag(req);
    return res.status(200).json({
      success: true,
      message: "Raag deleted successfully!",
      raag,
    });
  } catch (error) {
    next(error);
  }
};

export const raagController = {
  addRaag,
  getAllRaags,
  getRaagById,
  updateRaag,
  deleteRaag,
};
