import { sectionService } from "../services/section.service.js";

const upsertSection = async (req, res, next) => {
  try {
    const section = await sectionService.upsertSection(req);
    const isUpdate = Boolean(req.body.sectionId);
    return res.status(isUpdate ? 200 : 201).json({
      success: true,
      message: isUpdate
        ? "Section updated successfully!"
        : "Section created successfully!",
      section,
    });
  } catch (error) {
    next(error);
  }
};

const getSectionById = async (req, res, next) => {
  try {
    const section = await sectionService.getSectionById(req);
    return res.status(200).json({
      success: true,
      message: "Section fetched successfully!",
      section,
    });
  } catch (error) {
    next(error);
  }
};

const getSectionsByCollaboratorId = async (req, res, next) => {
  try {
    const data = await sectionService.getSectionsByCollaboratorId(req);
    return res.status(200).json({
      success: true,
      message: "Sections fetched successfully!",
      ...data,
    });
  } catch (error) {
    next(error);
  }
};

const deleteSection = async (req, res, next) => {
  try {
    const section = await sectionService.deleteSection(req);
    return res.status(200).json({
      success: true,
      message: "Section deleted successfully!",
      section,
    });
  } catch (error) {
    next(error);
  }
};

export const sectionController = {
  upsertSection,
  getSectionById,
  getSectionsByCollaboratorId,
  deleteSection,
};
