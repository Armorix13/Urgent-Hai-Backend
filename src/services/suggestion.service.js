import Suggestion from "../models/suggestion.model.js";
import {
  PUBLIC_USER_SELECT,
  enrichPopulatedUserFieldAndSplit,
  enrichPopulatedUserFieldsAndSplit,
} from "../utils/userPublic.util.js";

/** Authenticated user may only load suggestions for their own user id. */
function assertOwnUserId(req, targetUserId) {
  if (String(targetUserId) !== String(req.userId)) {
    const err = new Error("Unauthorized to view suggestions for this user");
    err.statusCode = 403;
    throw err;
  }
}

export const getSuggestionById = async (id) => {
  return await Suggestion.findById(id);
};

const createSuggestion = async (req) => {
  try {
    const userId = req.userId;
    const { title, description } = req.body;

    const suggestion = new Suggestion({
      userId,
      title,
      description,
    });

    await suggestion.save();
    const lean = await Suggestion.findById(suggestion._id)
      .populate("userId", PUBLIC_USER_SELECT)
      .lean();
    return { suggestion: enrichPopulatedUserFieldAndSplit(lean, "userId") };
  } catch (error) {
    console.error("Create Suggestion Error:", error);
    throw new Error(error.message || "Failed to create suggestion");
  }
};

const getAllSuggestions = async (req) => {
  try {
    const userId = req.userId;
    const suggestions = await Suggestion.find({ userId })
      .populate("userId", PUBLIC_USER_SELECT)
      .sort({ createdAt: -1 })
      .lean();
    return {
      suggestions: enrichPopulatedUserFieldsAndSplit(suggestions, "userId"),
    };
  } catch (error) {
    console.error("Get All Suggestions Error:", error);
    throw new Error(error.message || "Failed to get suggestions");
  }
};

const getSuggestionByIdService = async (req) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const suggestion = await getSuggestionById(id);
    if (!suggestion) {
      throw new Error("Suggestion not found");
    }

    if (suggestion.userId.toString() !== userId) {
      throw new Error("Unauthorized to view this suggestion");
    }

    const lean = await Suggestion.findById(id)
      .populate("userId", PUBLIC_USER_SELECT)
      .lean();
    return { suggestion: enrichPopulatedUserFieldAndSplit(lean, "userId") };
  } catch (error) {
    throw new Error(error.message || "Failed to get suggestion");
  }
};

const getSuggestionsByUserId = async (req) => {
  try {
    const { userId: targetUserId } = req.params;
    assertOwnUserId(req, targetUserId);

    const suggestions = await Suggestion.find({ userId: targetUserId })
      .populate("userId", PUBLIC_USER_SELECT)
      .sort({ createdAt: -1 })
      .lean();
    return {
      suggestions: enrichPopulatedUserFieldsAndSplit(suggestions, "userId"),
    };
  } catch (error) {
    console.error("Get suggestions by user Error:", error);
    if (error.statusCode) throw error;
    throw new Error(error.message || "Failed to get suggestions");
  }
};

const updateSuggestion = async (req) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { title, description } = req.body;

    const suggestion = await getSuggestionById(id);
    if (!suggestion) {
      throw new Error("Suggestion not found");
    }

    if (suggestion.userId.toString() !== userId) {
      throw new Error("Unauthorized to update this suggestion");
    }

    if (title !== undefined) suggestion.title = title;
    if (description !== undefined) suggestion.description = description;

    await suggestion.save();
    const lean = await Suggestion.findById(id)
      .populate("userId", PUBLIC_USER_SELECT)
      .lean();
    return { suggestion: enrichPopulatedUserFieldAndSplit(lean, "userId") };
  } catch (error) {
    console.error("Update Suggestion Error:", error);
    throw new Error(error.message || "Failed to update suggestion");
  }
};

const deleteSuggestion = async (req) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const suggestion = await getSuggestionById(id);
    if (!suggestion) {
      throw new Error("Suggestion not found");
    }

    if (suggestion.userId.toString() !== userId) {
      throw new Error("Unauthorized to delete this suggestion");
    }

    await Suggestion.findByIdAndDelete(id);
    return {};
  } catch (error) {
    console.error("Delete Suggestion Error:", error);
    throw new Error(error.message || "Failed to delete suggestion");
  }
};

export const suggestionService = {
  createSuggestion,
  getAllSuggestions,
  getSuggestionsByUserId,
  getSuggestionById: getSuggestionByIdService,
  updateSuggestion,
  deleteSuggestion,
};
