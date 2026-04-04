import mongoose from "mongoose";
import CourseVideo from "../models/courseVideo.model.js";

/**
 * Splits a course payload into Mongoose course fields vs inline `videos` for CourseVideo sync.
 * `hasVideos` is true only when the client sent a `videos` key (so omit = leave videos unchanged on update).
 */
export function splitCourseBody(body) {
  if (!body || typeof body !== "object") {
    return { courseFields: body, videos: undefined, hasVideos: false };
  }
  const hasVideos = Object.hasOwn(body, "videos");
  const { videos, ...courseFields } = body;
  return { courseFields, videos, hasVideos };
}

export function normalizeInlineVideoInput(raw, index) {
  const url = raw?.videoUrl ?? raw?.video_url;
  const s = url != null ? String(url).trim() : "";
  return {
    video_url: s || undefined,
    title: raw?.title != null ? String(raw.title).trim() : "",
    description: raw?.description != null ? String(raw.description).trim() : "",
    order: typeof raw?.order === "number" ? raw.order : index,
    isActive: raw?.isActive !== false,
  };
}

/**
 * Replaces all CourseVideo rows for a course. Use [] to remove every video.
 * @param {import("mongoose").Types.ObjectId|string} courseId
 * @param {Array} videosInput
 * @param {import("mongoose").ClientSession|null} session
 */
export async function replaceCourseVideosForCourse(courseId, videosInput, session = null) {
  const oid =
    courseId instanceof mongoose.Types.ObjectId
      ? courseId
      : new mongoose.Types.ObjectId(String(courseId));
  const opts = session ? { session } : {};
  await CourseVideo.deleteMany({ courseId: oid }, opts);
  if (!videosInput?.length) return;
  const docs = videosInput.map((v, i) => ({
    courseId: oid,
    ...normalizeInlineVideoInput(v, i),
  }));
  await CourseVideo.insertMany(docs, opts);
}

export async function deleteAllVideosForCourse(courseId, session = null) {
  const oid =
    courseId instanceof mongoose.Types.ObjectId
      ? courseId
      : new mongoose.Types.ObjectId(String(courseId));
  await CourseVideo.deleteMany({ courseId: oid }, session ? { session } : {});
}
