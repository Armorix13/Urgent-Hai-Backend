import Suggestion from "../models/suggestion.model.js";
import { getPublicUserById } from "../utils/userPublic.util.js";

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
    const [lean, user] = await Promise.all([
      Suggestion.findById(suggestion._id).lean(),
      getPublicUserById(userId),
    ]);
    return { suggestion: lean, user };
  } catch (error) {
    console.error("Create Suggestion Error:", error);
    throw new Error(error.message || "Failed to create suggestion");
  }
};

const getAllSuggestions = async (req) => {
  try {
    const userId = req.userId;
    const [suggestions, user] = await Promise.all([
      Suggestion.find({ userId }).sort({ createdAt: -1 }).lean(),
      getPublicUserById(userId),
    ]);
    return { suggestions, user };
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

    const [lean, user] = await Promise.all([
      Suggestion.findById(id).lean(),
      getPublicUserById(userId),
    ]);
    return { suggestion: lean, user };
  } catch (error) {
    throw new Error(error.message || "Failed to get suggestion");
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
    const [lean, user] = await Promise.all([
      Suggestion.findById(id).lean(),
      getPublicUserById(userId),
    ]);
    return { suggestion: lean, user };
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
    const user = await getPublicUserById(userId);
    return { user };
  } catch (error) {
    console.error("Delete Suggestion Error:", error);
    throw new Error(error.message || "Failed to delete suggestion");
  }
};

export const suggestionService = {
  createSuggestion,
  getAllSuggestions,
  getSuggestionById: getSuggestionByIdService,
  updateSuggestion,
  deleteSuggestion,
};
