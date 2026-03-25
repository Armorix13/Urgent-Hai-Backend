import CourseVideo from "../models/courseVideo.model.js";

/** Normalize CourseVideo doc for JSON (video_url → videoUrl). */
export const normalizeVideoForClient = (doc) => {
  if (!doc) return doc;
  const o = { ...doc };
  const url = o.videoUrl ?? o.video_url;
  delete o.video_url;
  o.videoUrl =
    url != null && String(url).trim() !== "" ? String(url).trim() : null;
  return o;
};

export const fetchVideosForCourse = async (courseId) => {
  const rows = await CourseVideo.getVideosByCourseId(courseId);
  return rows.map(normalizeVideoForClient);
};

/** Batch: Map<courseIdStr, videos[]> */
export const fetchVideosGroupedByCourseIds = async (courseIds) => {
  if (!courseIds.length) return new Map();
  const list = await CourseVideo.find({
    courseId: { $in: courseIds },
    isActive: true,
  })
    .sort({ order: 1 })
    .lean();
  const map = new Map();
  for (const v of list) {
    const key = v.courseId.toString();
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(normalizeVideoForClient(v));
  }
  return map;
};

/** Attach videos + counts to a populated `course` object (mutates spread). */
export const attachVideosToCourseLean = (course, videos) => ({
  ...course,
  videos,
  videoCount: videos.length,
  videosCount: videos.length,
});
