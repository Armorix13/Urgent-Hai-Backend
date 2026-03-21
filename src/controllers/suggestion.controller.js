import { suggestionService } from "../services/suggestion.service.js";

const createSuggestion = async (req, res, next) => {
  try {
    const suggestion = await suggestionService.createSuggestion(req);
    return res.status(201).json({
      success: true,
      message: "Suggestion submitted successfully!",
      suggestion,
    });
  } catch (error) {
    next(error);
  }
};

const getAllSuggestions = async (req, res, next) => {
  try {
    const suggestions = await suggestionService.getAllSuggestions(req);
    return res.status(200).json({
      success: true,
      message: "Suggestions fetched successfully!",
      suggestions,
    });
  } catch (error) {
    next(error);
  }
};

const getSuggestionById = async (req, res, next) => {
  try {
    const suggestion = await suggestionService.getSuggestionById(req);
    return res.status(200).json({
      success: true,
      message: "Suggestion fetched successfully!",
      suggestion,
    });
  } catch (error) {
    next(error);
  }
};

const updateSuggestion = async (req, res, next) => {
  try {
    const suggestion = await suggestionService.updateSuggestion(req);
    return res.status(200).json({
      success: true,
      message: "Suggestion updated successfully!",
      suggestion,
    });
  } catch (error) {
    next(error);
  }
};

const deleteSuggestion = async (req, res, next) => {
  try {
    await suggestionService.deleteSuggestion(req);
    return res.status(200).json({
      success: true,
      message: "Suggestion deleted successfully!",
    });
  } catch (error) {
    next(error);
  }
};

export const suggestionController = {
  createSuggestion,
  getAllSuggestions,
  getSuggestionById,
  updateSuggestion,
  deleteSuggestion,
};
