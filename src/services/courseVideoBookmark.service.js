import CourseVideoBookmark from "../models/courseVideoBookmark.model.js";

function assertLearner(req) {
  if (req.authKind !== "user" || !req.userId) {
    const err = new Error("Only learner accounts can manage video bookmarks.");
    err.statusCode = 403;
    throw err;
  }
}

function formatBookmarkDoc(doc) {
  if (!doc) return null;
  const o = typeof doc.toObject === "function" ? doc.toObject() : { ...doc };
  return {
    _id: o._id,
    userId: o.userId != null ? String(o.userId) : null,
    title: o.title,
    videoUrl: o.videoUrl,
    description: o.description ?? "",
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

const createBookmark = async (req) => {
  assertLearner(req);
  const { title, videoUrl, description = "" } = req.body;

  const created = await CourseVideoBookmark.create({
    userId: req.userId,
    title: String(title).trim(),
    videoUrl: String(videoUrl).trim(),
    description: typeof description === "string" ? description.trim() : "",
  });

  const row = await CourseVideoBookmark.findById(created._id);
  return formatBookmarkDoc(row);
};

const getMyBookmarks = async (req) => {
  assertLearner(req);
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const skip = (page - 1) * limit;

  const filter = { userId: req.userId };
  const total = await CourseVideoBookmark.countDocuments(filter);

  const rows = await CourseVideoBookmark.find(filter)
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit);

  return {
    bookmarks: rows.map((r) => formatBookmarkDoc(r)),
    total,
    page,
    totalPages: Math.ceil(total / limit) || 0,
  };
};

const deleteBookmark = async (req) => {
  assertLearner(req);
  const doc = await CourseVideoBookmark.findOne({ _id: req.params.id, userId: req.userId });
  if (!doc) {
    throw new Error("Bookmark not found");
  }
  const snapshot = formatBookmarkDoc(doc);
  await CourseVideoBookmark.deleteOne({ _id: doc._id });
  return snapshot;
};

export const courseVideoBookmarkService = {
  createBookmark,
  getMyBookmarks,
  deleteBookmark,
};
