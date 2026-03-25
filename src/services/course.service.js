import Course from "../models/course.model.js";
import CourseVideo from "../models/courseVideo.model.js";
import {
  computeCourseWatchAccess,
  applyWatchPolicyToCourse,
  buildWatchContext,
} from "../utils/courseAccess.js";

/** Normalize CourseVideo doc for JSON (video_url → videoUrl). */
const normalizeVideoForClient = (doc) => {
  if (!doc) return doc;
  const o = { ...doc };
  if (o.video_url != null) {
    o.videoUrl = o.video_url;
    delete o.video_url;
  }
  return o;
};

const sanitizeCoursePayload = (body) => {
  if (!body || typeof body !== "object") return body;
  const next = { ...body };
  if (next.thumbnail !== undefined) {
    const t = next.thumbnail;
    if (t === "" || (typeof t === "string" && !t.trim())) {
      next.thumbnail = null;
    }
  }
  return next;
};

const fetchVideosForCourse = async (courseId) => {
  const rows = await CourseVideo.getVideosByCourseId(courseId);
  return rows.map(normalizeVideoForClient);
};

/** Batch: { courseIdStr: videos[] } */
const fetchVideosGroupedByCourseIds = async (courseIds) => {
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

const addCourse = async (req) => {
  try {
    const body = sanitizeCoursePayload(req.body);
    if (body.courseType === 1 && (body.price == null || body.price < 0)) {
      throw new Error("Price is required for paid courses");
    }
    const course = await Course.create(body);
    return course;
  } catch (err) {
    throw err;
  }
};

const getCoursesWithPagination = async (req) => {
  try {
    const {
      page,
      limit,
      search,
      courseType,
      category,
      level,
      sortBy,
      sortOrder,
      minPrice,
      maxPrice,
      tags,
      isActive,
    } = req.query;

    const tagsArr = tags ? tags.split(",").map((t) => t.trim().toLowerCase()) : null;

    const result = await Course.getCoursesWithPagination({
      page: page || 1,
      limit: limit || 10,
      search: search || "",
      courseType: courseType ? parseInt(courseType) : null,
      category: category || null,
      level: level || null,
      sortBy: sortBy || "createdAt",
      sortOrder: sortOrder || "desc",
      minPrice: minPrice ? parseFloat(minPrice) : null,
      maxPrice: maxPrice ? parseFloat(maxPrice) : null,
      tags: tagsArr,
      isActive: isActive !== undefined ? isActive === "true" : null,
    });

    let courses = result.courses;
    if (courses.length) {
      const ids = courses.map((c) => c._id);
      const ctx = await buildWatchContext(req, ids);
      const grouped = await fetchVideosGroupedByCourseIds(ids);
      courses = courses.map((c) => {
        const videos = grouped.get(c._id.toString()) ?? [];
        const base = {
          ...c,
          videoCount: videos.length,
          videos,
        };
        const access = computeCourseWatchAccess(base, {
          userId: ctx.userId,
          hasSubscription: ctx.hasSubscription,
          purchasedCourseIds: ctx.purchasedSet,
          isAdmin: ctx.isAdmin,
        });
        return applyWatchPolicyToCourse(base, access);
      });
    }

    return { ...result, courses };
  } catch (err) {
    throw err;
  }
};

const getCourseById = async (req) => {
  try {
    const { id } = req.params;
    const course = await Course.findById(id).lean();

    if (!course) {
      throw new Error("Course not found");
    }

    if (course.isDeleted) {
      throw new Error("Course not found");
    }

    const videos = await fetchVideosForCourse(id);
    const ctx = await buildWatchContext(req, [course._id]);
    const base = {
      ...course,
      videoCount: videos.length,
      videos,
    };
    const access = computeCourseWatchAccess(base, {
      userId: ctx.userId,
      hasSubscription: ctx.hasSubscription,
      purchasedCourseIds: ctx.purchasedSet,
      isAdmin: ctx.isAdmin,
    });
    return applyWatchPolicyToCourse(base, access);
  } catch (err) {
    throw err;
  }
};

const getSimilarCourses = async (req) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit) || 5;

    const course = await Course.findById(id);
    if (!course) {
      throw new Error("Course not found");
    }

    const similar = await Course.getSimilarCourses(
      id,
      course.category,
      limit
    );
    if (!similar.length) return similar;
    const ids = similar.map((c) => c._id);
    const ctx = await buildWatchContext(req, ids);
    const grouped = await fetchVideosGroupedByCourseIds(ids);
    return similar.map((c) => {
      const videos = grouped.get(c._id.toString()) ?? [];
      const base = {
        ...c,
        videoCount: videos.length,
        videos,
      };
      const access = computeCourseWatchAccess(base, {
        userId: ctx.userId,
        hasSubscription: ctx.hasSubscription,
        purchasedCourseIds: ctx.purchasedSet,
        isAdmin: ctx.isAdmin,
      });
      return applyWatchPolicyToCourse(base, access);
    });
  } catch (err) {
    throw err;
  }
};

const updateCourse = async (req) => {
  try {
    const { id } = req.params;
    const updates = sanitizeCoursePayload(req.body);

    const course = await Course.findByIdAndUpdate(id, updates, { new: true });

    if (!course) {
      throw new Error("Course not found");
    }

    return course;
  } catch (err) {
    throw err;
  }
};

const deleteCourse = async (req) => {
  try {
    const { id } = req.params;

    const course = await Course.findByIdAndUpdate(
      id,
      { isDeleted: true, isActive: false },
      { new: true }
    );

    if (!course) {
      throw new Error("Course not found");
    }

    return course;
  } catch (err) {
    throw err;
  }
};

const hardDeleteCourse = async (req) => {
  try {
    const { id } = req.params;
    const course = await Course.findByIdAndDelete(id);

    if (!course) {
      throw new Error("Course not found");
    }

    return course;
  } catch (err) {
    throw err;
  }
};

export const courseService = {
  addCourse,
  getCoursesWithPagination,
  getCourseById,
  getSimilarCourses,
  updateCourse,
  deleteCourse,
  hardDeleteCourse,
};
