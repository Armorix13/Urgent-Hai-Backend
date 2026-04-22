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

const getCollaboratorMe = async (req, res, next) => {
  try {
    const collaborator = await collaboratorService.getCollaboratorMe(req);
    return res.status(200).json({
      success: true,
      message: "Profile loaded.",
      collaborator,
    });
  } catch (error) {
    next(error);
  }
};

const updateCollaboratorMe = async (req, res, next) => {
  try {
    const result = await collaboratorService.updateCollaboratorMe(req);
    const { collaborator, access_token, refresh_token } = result;
    const passwordChanged = Boolean(access_token);
    return res.status(200).json({
      success: true,
      message: passwordChanged
        ? "Password updated. Your session has been refreshed."
        : "Profile updated.",
      collaborator,
      ...(passwordChanged ? { access_token, refresh_token } : {}),
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

const lookupCollaborator = async (req, res, next) => {
  try {
    const result = await collaboratorService.lookupCollaborator(req);
    return res.status(200).json({
      success: true,
      message: "Collaborator profile found.",
      hasPassword: result.hasPassword,
      email: result.email,
      phoneNumber: result.phoneNumber,
      name: result.name,
    });
  } catch (error) {
    next(error);
  }
};

const setCollaboratorPassword = async (req, res, next) => {
  try {
    const collaborator = await collaboratorService.setCollaboratorPassword(req);
    return res.status(200).json({
      success: true,
      message: "Password set successfully!",
      collaborator,
    });
  } catch (error) {
    next(error);
  }
};

const loginCollaborator = async (req, res, next) => {
  try {
    const result = await collaboratorService.loginCollaborator(req);
    if (result.needsPasswordSetup) {
      return res.status(403).json({
        success: false,
        message:
          "Password is not set for this profile yet. Set a password using the same email or phone number, then sign in again.",
        needsPasswordSetup: true,
        phoneNumber: result.phoneNumber,
        email: result.email,
      });
    }
    return res.status(200).json({
      success: true,
      message: "Collaborator login successful!",
      collaborator: result.collaborator,
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
  getCollaboratorMe,
  updateCollaboratorMe,
  getAllCollaborators,
  lookupCollaborator,
  setCollaboratorPassword,
  loginCollaborator,
  deleteCollaborator,
};
