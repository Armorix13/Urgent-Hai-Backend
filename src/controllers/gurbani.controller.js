import { gurbaniService } from "../services/gurbani.service.js";

const addGurbani = async (req, res, next) => {
  try {
    const gurbani = await gurbaniService.addGurbani(req);
    res.status(201).json({
      success: true,
      message: "Gurbani created successfully!",
      gurbani,
    });
  } catch (error) {
    next(error);
  }
};

const getAllGurbani = async (req, res, next) => {
  try {
    const data = await gurbaniService.getAllGurbani(req);
    res.status(200).json({
      success: true,
      message: "Gurbani fetched successfully!",
      ...data,
    });
  } catch (error) {
    next(error);
  }
};

const getGurbaniById = async (req, res, next) => {
  try {
    const gurbani = await gurbaniService.getGurbaniById(req);
    res.status(200).json({
      success: true,
      message: "Gurbani fetched successfully!",
      gurbani,
    });
  } catch (error) {
    next(error);
  }
};

const updateGurbani = async (req, res, next) => {
  try {
    const gurbani = await gurbaniService.updateGurbani(req);
    res.status(200).json({
      success: true,
      message: "Gurbani updated successfully!",
      gurbani,
    });
  } catch (error) {
    next(error);
  }
};

const deleteGurbani = async (req, res, next) => {
  try {
    const gurbani = await gurbaniService.deleteGurbani(req);
    res.status(200).json({
      success: true,
      message: "Gurbani deleted successfully!",
      gurbani,
    });
  } catch (error) {
    next(error);
  }
};

const addBaani = async (req, res, next) => {
  try {
    const gurbani = await gurbaniService.addBaani(req);
    res.status(200).json({
      success: true,
      message: "Baani added successfully!",
      gurbani,
    });
  } catch (error) {
    next(error);
  }
};

const updateBaani = async (req, res, next) => {
  try {
    const gurbani = await gurbaniService.updateBaani(req);
    res.status(200).json({
      success: true,
      message: "Baani updated successfully!",
      gurbani,
    });
  } catch (error) {
    next(error);
  }
};

const deleteBaani = async (req, res, next) => {
  try {
    const gurbani = await gurbaniService.deleteBaani(req);
    res.status(200).json({
      success: true,
      message: "Baani deleted successfully!",
      gurbani,
    });
  } catch (error) {
    next(error);
  }
};

export const gurbaniController = {
  addGurbani,
  getAllGurbani,
  getGurbaniById,
  updateGurbani,
  deleteGurbani,
  addBaani,
  updateBaani,
  deleteBaani,
};
