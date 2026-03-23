import { previousResultService } from "../services/previousResult.service.js";

const addPreviousResult = async (req, res, next) => {
  try {
    const previousResult = await previousResultService.addPreviousResult(req);
    return res.status(201).json({
      success: true,
      message: "Previous result created successfully!",
      previousResult,
    });
  } catch (error) {
    next(error);
  }
};

const getAllPreviousResults = async (req, res, next) => {
  try {
    const data = await previousResultService.getAllPreviousResults(req);
    return res.status(200).json({
      success: true,
      message: "Previous results fetched successfully!",
      ...data,
    });
  } catch (error) {
    next(error);
  }
};

const getPreviousResultById = async (req, res, next) => {
  try {
    const previousResult = await previousResultService.getPreviousResultById(req);
    return res.status(200).json({
      success: true,
      message: "Previous result fetched successfully!",
      previousResult,
    });
  } catch (error) {
    next(error);
  }
};

const updatePreviousResult = async (req, res, next) => {
  try {
    const previousResult = await previousResultService.updatePreviousResult(req);
    return res.status(200).json({
      success: true,
      message: "Previous result updated successfully!",
      previousResult,
    });
  } catch (error) {
    next(error);
  }
};

const deletePreviousResult = async (req, res, next) => {
  try {
    const previousResult = await previousResultService.deletePreviousResult(req);
    return res.status(200).json({
      success: true,
      message: "Previous result deleted successfully!",
      previousResult,
    });
  } catch (error) {
    next(error);
  }
};

export const previousResultController = {
  addPreviousResult,
  getAllPreviousResults,
  getPreviousResultById,
  updatePreviousResult,
  deletePreviousResult,
};
