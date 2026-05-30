import * as collaboratorRaagService from "../services/collaboratorRaag.service.js";

export const getAllRaags = async (req, res, next) => {
  try {
    const raags = await collaboratorRaagService.getAllRaags();
    res.status(200).json({
      success: true,
      raags,
    });
  } catch (error) {
    next(error);
  }
};

export const getRaagById = async (req, res, next) => {
  try {
    const raag = await collaboratorRaagService.getRaagById(req.params.id);
    res.status(200).json({
      success: true,
      raag,
    });
  } catch (error) {
    next(error);
  }
};

export const createRaag = async (req, res, next) => {
  try {
    const raag = await collaboratorRaagService.createRaag(req.body);
    res.status(201).json({
      success: true,
      message: "Raag created successfully",
      raag,
    });
  } catch (error) {
    next(error);
  }
};

export const updateRaag = async (req, res, next) => {
  try {
    const raag = await collaboratorRaagService.updateRaag(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: "Raag updated successfully",
      raag,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteRaag = async (req, res, next) => {
  try {
    await collaboratorRaagService.deleteRaag(req.params.id);
    res.status(200).json({
      success: true,
      message: "Raag deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
