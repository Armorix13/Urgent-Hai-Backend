import CourseVideo from "../models/courseVideo.model.js";
import Course from "../models/course.model.js";
import {
  buildWatchContext,
  computeCourseWatchAccess,
  redactVideos,
} from "../utils/courseAccess.js";

const normalizeVideoForClient = (doc) => {
  if (!doc) return doc;
  const o = doc.toObject ? doc.toObject() : { ...doc };
  const plain = { ...o };
  if (plain.video_url != null) {
    plain.videoUrl = plain.video_url;
    delete plain.video_url;
  }
  return plain;
};

const addCourseVideo = async (req) => {
  try {
    const { courseId, video_url, title, description, order, isActive } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      throw new Error("Course not found");
    }

    const video = await CourseVideo.create({
      courseId,
      video_url,
      title,
      description,
      order: order ?? 0,
      isActive: isActive !== false,
    });

    return video;
  } catch (err) {
    throw err;
  }
};

const getVideosByCourseId = async (req) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId).lean();
    if (!course || course.isDeleted) {
      throw new Error("Course not found");
    }

    const raw = await CourseVideo.getVideosByCourseId(courseId);
    const videos = raw.map(normalizeVideoForClient);
    const ctx = await buildWatchContext(req, [course._id]);
    const access = computeCourseWatchAccess(course, {
      userId: ctx.userId,
      hasSubscription: ctx.hasSubscription,
      purchasedCourseIds: ctx.purchasedSet,
      isAdmin: ctx.isAdmin,
    });
    return redactVideos(videos, access.canWatchFull);
  } catch (err) {
    throw err;
  }
};

const getCourseVideoById = async (req) => {
  try {
    const { id } = req.params;
    const video = await CourseVideo.findById(id).lean();

    if (!video) {
      throw new Error("Course video not found");
    }

    const course = await Course.findById(video.courseId).lean();
    if (!course || course.isDeleted) {
      throw new Error("Course not found");
    }

    const ctx = await buildWatchContext(req, [course._id]);
    const access = computeCourseWatchAccess(course, {
      userId: ctx.userId,
      hasSubscription: ctx.hasSubscription,
      purchasedCourseIds: ctx.purchasedSet,
      isAdmin: ctx.isAdmin,
    });
    let v = normalizeVideoForClient(video);
    if (!access.canWatchFull) {
      v = { ...v, videoUrl: null, locked: true };
    }
    return v;
  } catch (err) {
    throw err;
  }
};

const updateCourseVideo = async (req) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const video = await CourseVideo.findByIdAndUpdate(id, updates, {
      new: true,
    });

    if (!video) {
      throw new Error("Course video not found");
    }

    return video;
  } catch (err) {
    throw err;
  }
};

const deleteCourseVideo = async (req) => {
  try {
    const { id } = req.params;

    const video = await CourseVideo.findByIdAndDelete(id);
    if (!video) {
      throw new Error("Course video not found");
    }

    return video;
  } catch (err) {
    throw err;
  }
};

export const courseVideoService = {
  addCourseVideo,
  getVideosByCourseId,
  getCourseVideoById,
  updateCourseVideo,
  deleteCourseVideo,
};
