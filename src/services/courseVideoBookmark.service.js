import CourseVideo from "../models/courseVideo.model.js";
import CourseVideoBookmark from "../models/courseVideoBookmark.model.js";
import { normalizeVideoForClient } from "../utils/courseVideo.util.js";

function assertLearner(req) {
  if (req.authKind !== "user" || !req.userId) {
    const err = new Error("Only learner accounts can manage video bookmarks.");
    err.statusCode = 403;
    throw err;
  }
}

function pickCourseSummary(course) {
  if (!course || typeof course !== "object" || !course._id) return null;
  return {
    _id: course._id,
    title: course.title,
    identifierId: course.identifierId ?? null,
    thumbnail: course.thumbnail ?? null,
    category: course.category ?? null,
    isDeleted: Boolean(course.isDeleted),
  };
}

/** Shape one bookmark for API: flat course + normalized video. */
function formatBookmarkDoc(doc) {
  if (!doc) return null;
  const o = typeof doc.toObject === "function" ? doc.toObject() : { ...doc };
  const rawVideo = o.courseVideoId;
  delete o.courseVideoId;

  if (rawVideo && typeof rawVideo === "object" && rawVideo._id) {
    const courseRef = rawVideo.courseId;
    const videoPlain = { ...rawVideo };
    delete videoPlain.courseId;
    o.courseVideo = normalizeVideoForClient(videoPlain);
    o.course = pickCourseSummary(
      courseRef && typeof courseRef === "object" ? courseRef : null,
    );
  } else {
    o.courseVideo = null;
    o.course = null;
  }

  o.userId = o.userId != null ? String(o.userId) : null;
  return o;
}

const populateBookmark = (q) =>
  q.populate({
    path: "courseVideoId",
    populate: {
      path: "courseId",
      select: "title identifierId thumbnail category isDeleted",
    },
  });

const createBookmark = async (req) => {
  assertLearner(req);
  const { courseVideoId, note = "" } = req.body;

  const video = await CourseVideo.findById(courseVideoId).select("_id").lean();
  if (!video) {
    throw new Error("Course video not found");
  }

  const existing = await populateBookmark(
    CourseVideoBookmark.findOne({ userId: req.userId, courseVideoId }),
  );
  if (existing) {
    return {
      bookmark: formatBookmarkDoc(existing),
      alreadyBookmarked: true,
    };
  }

  try {
    const created = await CourseVideoBookmark.create({
      userId: req.userId,
      courseVideoId,
      note: note || "",
    });
    const full = await populateBookmark(CourseVideoBookmark.findById(created._id));
    return { bookmark: formatBookmarkDoc(full), alreadyBookmarked: false };
  } catch (err) {
    if (err && err.code === 11000) {
      const dup = await populateBookmark(
        CourseVideoBookmark.findOne({ userId: req.userId, courseVideoId }),
      );
      return { bookmark: formatBookmarkDoc(dup), alreadyBookmarked: true };
    }
    throw err;
  }
};

const getMyBookmarks = async (req) => {
  assertLearner(req);
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const skip = (page - 1) * limit;

  const filter = { userId: req.userId };
  const total = await CourseVideoBookmark.countDocuments(filter);

  const rows = await populateBookmark(
    CourseVideoBookmark.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit),
  );

  return {
    bookmarks: rows.map((r) => formatBookmarkDoc(r)),
    total,
    page,
    totalPages: Math.ceil(total / limit) || 0,
  };
};

const getBookmarkById = async (req) => {
  assertLearner(req);
  const row = await populateBookmark(
    CourseVideoBookmark.findOne({ _id: req.params.id, userId: req.userId }),
  );
  if (!row) {
    throw new Error("Bookmark not found");
  }
  return formatBookmarkDoc(row);
};

const updateBookmark = async (req) => {
  assertLearner(req);
  const { note } = req.body;

  const updated = await populateBookmark(
    CourseVideoBookmark.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { note: note || "" },
      { new: true, runValidators: true },
    ),
  );

  if (!updated) {
    throw new Error("Bookmark not found");
  }
  return formatBookmarkDoc(updated);
};

const deleteBookmark = async (req) => {
  assertLearner(req);
  const doc = await populateBookmark(
    CourseVideoBookmark.findOne({ _id: req.params.id, userId: req.userId }),
  );
  if (!doc) {
    throw new Error("Bookmark not found");
  }
  await CourseVideoBookmark.deleteOne({ _id: doc._id });
  return formatBookmarkDoc(doc);
};

export const courseVideoBookmarkService = {
  createBookmark,
  getMyBookmarks,
  getBookmarkById,
  updateBookmark,
  deleteBookmark,
};
