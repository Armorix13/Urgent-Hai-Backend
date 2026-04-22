import Suggestion from "../models/suggestion.model.js";
import {
  PUBLIC_USER_SELECT,
  enrichPopulatedUserFieldAndSplit,
  enrichPopulatedUserFieldsAndSplit,
} from "../utils/userPublic.util.js";

/** Learner may only load another user's suggestions via /user/:userId if it is their own id. */
function assertOwnUserId(req, targetUserId) {
  if (req.authKind !== "user" || !req.userId) {
    const err = new Error("Unauthorized to view suggestions for this user");
    err.statusCode = 403;
    throw err;
  }
  if (String(targetUserId) !== String(req.userId)) {
    const err = new Error("Unauthorized to view suggestions for this user");
    err.statusCode = 403;
    throw err;
  }
}

function assertAuthenticated(req) {
  if (req.authKind !== "user" && req.authKind !== "collaborator") {
    const err = new Error("Unauthorized");
    err.statusCode = 401;
    throw err;
  }
}

/** Only the learner who created the suggestion may update or delete it. */
function assertOwnerUser(req, suggestion) {
  if (!suggestion) {
    throw new Error("Suggestion not found");
  }
  if (!req.userId || String(suggestion.userId) !== String(req.userId)) {
    const err = new Error("Unauthorized to modify this suggestion");
    err.statusCode = 403;
    throw err;
  }
}

function paginationMeta(page, limit, total) {
  const totalPages = Math.max(1, Math.ceil(total / limit) || 1);
  return {
    currentPage: page,
    pageSize: limit,
    totalPages,
    totalItems: total,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

const SEARCH_MAX_LEN = 100;

function normalizeSearchQuery(raw) {
  const s = String(raw ?? "").trim();
  if (!s) return "";
  return s.length > SEARCH_MAX_LEN ? s.slice(0, SEARCH_MAX_LEN) : s;
}

function buildSearchFilter(searchQuery) {
  if (!searchQuery) return {};
  const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escaped, "i");
  return { $or: [{ title: regex }, { description: regex }] };
}

async function getSuggestionAnalytics() {
  const now = new Date();
  const start7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const start30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [totalSuggestions, submittedLast7Days, submittedLast30Days, contributorIds] =
    await Promise.all([
      Suggestion.countDocuments({}),
      Suggestion.countDocuments({ createdAt: { $gte: start7 } }),
      Suggestion.countDocuments({ createdAt: { $gte: start30 } }),
      Suggestion.distinct("userId", {}),
    ]);

  return {
    totalSuggestions,
    submittedLast7Days,
    submittedLast30Days,
    uniqueContributors: contributorIds.length,
  };
}

export const getSuggestionById = async (id) => {
  return await Suggestion.findById(id);
};

const createSuggestion = async (req) => {
  if (req.authKind !== "user" || !req.userId) {
    const err = new Error("Only learner accounts can submit suggestions");
    err.statusCode = 403;
    throw err;
  }

  const { title, description } = req.body;

  const suggestion = new Suggestion({
    userId: req.userId,
    title,
    description,
  });

  await suggestion.save();
  const lean = await Suggestion.findById(suggestion._id)
    .populate("userId", PUBLIC_USER_SELECT)
    .lean();
  return { suggestion: enrichPopulatedUserFieldAndSplit(lean, "userId") };
};

/**
 * All suggestions (newest first). Any authenticated user or collaborator may list.
 * Optional pagination: ?page=&limit=
 * Optional search: ?search= matches title or description (case-insensitive).
 * Response includes board `analytics` (global counts) on every list call.
 */
const getAllSuggestions = async (req) => {
  assertAuthenticated(req);

  const searchApplied = normalizeSearchQuery(req.query?.search);
  const filter = buildSearchFilter(searchApplied);

  const pageRaw = req.query?.page;
  const limitRaw = req.query?.limit;

  const usePagination =
    pageRaw !== undefined &&
    pageRaw !== "" &&
    limitRaw !== undefined &&
    limitRaw !== "";

  const analytics = await getSuggestionAnalytics();

  if (!usePagination) {
    const suggestions = await Suggestion.find(filter)
      .populate("userId", PUBLIC_USER_SELECT)
      .sort({ createdAt: -1 })
      .lean();
    return {
      suggestions: suggestions.map((s) => enrichPopulatedUserFieldAndSplit(s, "userId")),
      pagination: null,
      analytics,
      search: searchApplied || null,
    };
  }

  const page = Math.max(1, parseInt(String(pageRaw), 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(String(limitRaw), 10) || 10));
  const skip = (page - 1) * limit;

  const [rows, total] = await Promise.all([
    Suggestion.find(filter)
      .populate("userId", PUBLIC_USER_SELECT)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Suggestion.countDocuments(filter),
  ]);

  return {
    suggestions: rows.map((s) => enrichPopulatedUserFieldAndSplit(s, "userId")),
    pagination: paginationMeta(page, limit, total),
    analytics,
    search: searchApplied || null,
  };
};

/** Any authenticated user may read a single suggestion. */
const getSuggestionByIdService = async (req) => {
  assertAuthenticated(req);
  const { id } = req.params;

  const lean = await Suggestion.findById(id).populate("userId", PUBLIC_USER_SELECT).lean();
  if (!lean) {
    throw new Error("Suggestion not found");
  }
  return { suggestion: enrichPopulatedUserFieldAndSplit(lean, "userId") };
};

const getSuggestionsByUserId = async (req) => {
  const { userId: targetUserId } = req.params;
  assertOwnUserId(req, targetUserId);

  const suggestions = await Suggestion.find({ userId: targetUserId })
    .populate("userId", PUBLIC_USER_SELECT)
    .sort({ createdAt: -1 })
    .lean();
  return {
    suggestions: enrichPopulatedUserFieldsAndSplit(suggestions, "userId"),
  };
};

const updateSuggestion = async (req) => {
  if (req.authKind !== "user" || !req.userId) {
    const err = new Error("Unauthorized to update suggestions");
    err.statusCode = 403;
    throw err;
  }

  const { id } = req.params;
  const { title, description } = req.body;

  const suggestion = await getSuggestionById(id);
  assertOwnerUser(req, suggestion);

  if (title !== undefined) suggestion.title = title;
  if (description !== undefined) suggestion.description = description;

  await suggestion.save();
  const lean = await Suggestion.findById(id).populate("userId", PUBLIC_USER_SELECT).lean();
  return { suggestion: enrichPopulatedUserFieldAndSplit(lean, "userId") };
};

const deleteSuggestion = async (req) => {
  if (req.authKind !== "user" || !req.userId) {
    const err = new Error("Unauthorized to delete suggestions");
    err.statusCode = 403;
    throw err;
  }

  const { id } = req.params;

  const suggestion = await getSuggestionById(id);
  assertOwnerUser(req, suggestion);

  await Suggestion.findByIdAndDelete(id);
  return {};
};

export const suggestionService = {
  createSuggestion,
  getAllSuggestions,
  getSuggestionsByUserId,
  getSuggestionById: getSuggestionByIdService,
  updateSuggestion,
  deleteSuggestion,
};
