import { collaboratorService } from "../services/collaborator.service.js";

const addCollaborator = async (req, res, next) => {
  try {
    const collaborator = await collaboratorService.addCollaborator(req);
    return res.status(201).json({
      success: true,
      message: "Collaborator added successfully!",
      collaborator,
    });
  } catch (error) {
    next(error);
  }
};

const updateCollaborator = async (req, res, next) => {
  try {
    const collaborator = await collaboratorService.updateCollaborator(req);
    return res.status(200).json({
      success: true,
      message: "Collaborator updated successfully!",
      collaborator,
    });
  } catch (error) {
    next(error);
  }
};

const getCollaboratorById = async (req, res, next) => {
  try {
    const collaborator = await collaboratorService.getCollaboratorById(req);
    return res.status(200).json({
      success: true,
      message: "Collaborator fetched successfully!",
      collaborator,
    });
  } catch (error) {
    next(error);
  }
};

const getAllCollaborators = async (req, res, next) => {
  try {
    const collaborators = await collaboratorService.getAllCollaborators(req);
    return res.status(200).json({
      success: true,
      message: "Collaborators fetched successfully!",
      collaborators,
    });
  } catch (error) {
    next(error);
  }
};

const deleteCollaborator = async (req, res, next) => {
  try {
    const collaborator = await collaboratorService.deleteCollaborator(req);
    return res.status(200).json({
      success: true,
      message: "Collaborator deleted successfully!",
      collaborator,
    });
  } catch (error) {
    next(error);
  }
};

export const collaboratorController = {
  addCollaborator,
  updateCollaborator,
  getCollaboratorById,
  getAllCollaborators,
  deleteCollaborator,
};
