import mongoose from "mongoose";
import Course, { courseCollaboratorPopulate } from "../models/course.model.js";
import Collaborator from "../models/collaborator.model.js";
import {
  fetchVideosForCourse,
  fetchVideosGroupedByCourseIds,
} from "../utils/courseVideo.util.js";
import {
  deleteAllVideosForCourse,
  replaceCourseVideosForCourse,
  splitCourseBody,
} from "../utils/courseVideoSync.util.js";
import {
  applyWatchPolicyToCourse,
  FULL_LISTING_ACCESS,
} from "../utils/courseAccess.js";
import {
  attachCourseRatingsForCourses,
  attachUserCourseFlags,
} from "./rating.service.js";

/** Lean queries omit Mongoose virtuals; mirror courseTypeName for API consumers. */
const attachCourseTypeName = (course) => ({
  ...course,
  courseTypeName: Number(course.courseType) === 1 ? "paid" : "free",
});

/** Populated `collaborators` ref: add professionValue like other collaborator APIs. */
const enrichCourseCollaborator = (course) => {
  if (!course?.collaborators || typeof course.collaborators !== "object") {
    return course;
  }
  const col = course.collaborators;
  if (!col._id) return course;
  return {
    ...course,
    collaborators: {
      ...col,
      professionValue:
        col.profession != null && col.profession !== "" ? col.profession : null,
    },
  };
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
  if (next.identifierId !== undefined) {
    const id = next.identifierId;
    if (id === "" || (typeof id === "string" && !id.trim())) {
      next.identifierId = null;
    } else if (typeof id === "string") {
      next.identifierId = id.trim().toLowerCase();
    }
  }
  /** API `collaboratorId` → model `collaborators` (optional ObjectId ref). */
  if (
    Object.prototype.hasOwnProperty.call(next, "collaboratorId") ||
    Object.prototype.hasOwnProperty.call(next, "collaborators")
  ) {
    const raw = Object.prototype.hasOwnProperty.call(next, "collaboratorId")
      ? next.collaboratorId
      : next.collaborators;
    if (raw == null || raw === "" || (typeof raw === "string" && !String(raw).trim())) {
      next.collaborators = null;
    } else {
      next.collaborators = String(raw).trim();
    }
    delete next.collaboratorId;
  }
  return next;
};

async function assertCollaboratorExistsIfSet(collaboratorsRef) {
  if (collaboratorsRef == null) return;
  const id = String(collaboratorsRef).trim();
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid collaborator id.");
  }
  const exists = await Collaborator.exists({ _id: id });
  if (!exists) {
    throw new Error("Collaborator not found.");
  }
}

/**
 * Non-empty identifierId must be unique among all courses (stored lowercase), optional exclude _id for updates.
 */
async function assertIdentifierIdUnique(identifierId, excludeCourseId) {
  if (identifierId == null) return;
  const canonical = String(identifierId).trim().toLowerCase();
  if (!canonical) return;

  const query = { identifierId: canonical };
  if (excludeCourseId != null) {
    query._id = { $ne: excludeCourseId };
  }

  const found = await Course.findOne(query).select("_id").lean();
  if (found) {
    throw new Error(
      `A course with identifierId "${canonical}" already exists (must be unique per course).`
    );
  }
}

/** Set `courseContent[].order` from array index (client may omit `order`). */
function applySequentialOrderToCourseContent(courseFields) {
  if (!courseFields?.courseContent?.length) return;
  courseFields.courseContent = courseFields.courseContent.map((item, index) => ({
    ...item,
    order: index,
  }));
}

function rethrowDuplicateIdentifierId(err) {
  if (err && err.code === 11000) {
    const kp = err.keyPattern;
    const kv = err.keyValue;
    if (
      (kp && typeof kp === "object" && kp.identifierId !== undefined) ||
      (kv && typeof kv === "object" && kv.identifierId !== undefined)
    ) {
      throw new Error(
        "A course with this identifierId already exists (must be unique per course)."
      );
    }
  }
  throw err;
}

function resolveCourseFilter(filterRaw) {
  const filter = String(filterRaw || "")
    .trim()
    .toLowerCase();
  if (!filter) return { courseType: null, level: null };
  if (filter === "paid") return { courseType: 1, level: null };
  if (filter === "free") return { courseType: 2, level: null };
  if (filter === "beginner" || filter === "intermediate" || filter === "advanced") {
    return { courseType: null, level: filter };
  }
  return { courseType: null, level: null };
}

const addCourse = async (req) => {
  try {
    const body = sanitizeCoursePayload(req.body);
    if (body.courseType === 2) {
      body.price = 0;
    } else if (body.courseType === 1) {
      const p = Number(body.price);
      if (!Number.isFinite(p) || p <= 0) {
        throw new Error("Paid courses must have a price greater than zero.");
      }
      body.price = p;
    }
    const { courseFields, videos, hasVideos } = splitCourseBody(body);
    applySequentialOrderToCourseContent(courseFields);

    await assertIdentifierIdUnique(courseFields.identifierId);
    await assertCollaboratorExistsIfSet(courseFields.collaborators);

    if (!hasVideos) {
      try {
        return await Course.create(courseFields);
      } catch (err) {
        rethrowDuplicateIdentifierId(err);
      }
    }

    const session = await mongoose.startSession();
    try {
      let course;
      await session.withTransaction(async () => {
        try {
          const created = await Course.create([courseFields], { session });
          course = created[0];
        } catch (err) {
          rethrowDuplicateIdentifierId(err);
        }
        await replaceCourseVideosForCourse(course._id, videos ?? [], session);
      });
      return course;
    } finally {
      await session.endSession();
    }
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
      filter,
      category,
      level,
      sortBy,
      sortOrder,
      minPrice,
      maxPrice,
      tags,
      isActive,
      identifierId,
    } = req.query;

    const tagsArr = tags ? tags.split(",").map((t) => t.trim().toLowerCase()) : null;
    const resolvedFilter = resolveCourseFilter(filter);
    const effectiveCourseType = courseType ? parseInt(courseType, 10) : resolvedFilter.courseType;
    const effectiveLevel = level || resolvedFilter.level || null;

    const result = await Course.getCoursesWithPagination({
      page: page || 1,
      limit: limit || 10,
      search: search || "",
      courseType: effectiveCourseType,
      category: category || null,
      level: effectiveLevel,
      sortBy: sortBy || "createdAt",
      sortOrder: sortOrder || "desc",
      minPrice: minPrice ? parseFloat(minPrice) : null,
      maxPrice: maxPrice ? parseFloat(maxPrice) : null,
      tags: tagsArr,
      isActive: isActive !== undefined ? isActive === "true" : null,
      identifierId: identifierId?.trim?.() || null,
    });

    let courses = result.courses;
    if (courses.length) {
      const ids = courses.map((c) => c._id);
      const grouped = await fetchVideosGroupedByCourseIds(ids);
      courses = courses.map((c) => {
        const videos = grouped.get(c._id.toString()) ?? [];
        const base = {
          ...c,
          videoCount: videos.length,
          videos,
        };
        return enrichCourseCollaborator(applyWatchPolicyToCourse(base, FULL_LISTING_ACCESS));
      });
      courses = await attachUserCourseFlags(courses, req.userId);
      courses = courses.map(attachCourseTypeName);
      courses = await attachCourseRatingsForCourses(courses);
    }

    const totalVideosOnPage = courses.reduce(
      (sum, c) => sum + (c.videosCount ?? c.videoCount ?? 0),
      0
    );

    return { ...result, courses, totalVideosOnPage };
  } catch (err) {
    throw err;
  }
};

/** Same as public list but includes inactive and soft-deleted courses (no isActive / isDeleted filter). Collaborator Bearer token limits rows to `course.collaborators` === that id. */
const getCoursesWithPaginationAdmin = async (req) => {
  try {
    const {
      page,
      limit,
      search,
      courseType,
      filter,
      category,
      level,
      sortBy,
      sortOrder,
      minPrice,
      maxPrice,
      tags,
      identifierId,
    } = req.query;

    const tagsArr = tags ? tags.split(",").map((t) => t.trim().toLowerCase()) : null;
    const resolvedFilter = resolveCourseFilter(filter);
    const effectiveCourseType = courseType ? parseInt(courseType, 10) : resolvedFilter.courseType;
    const effectiveLevel = level || resolvedFilter.level || null;

    /** Mobile / legacy: omit `mine` → full admin list even with a collaborator token. Web passes `mine=true`. */
    const filterByCollaboratorId =
      req.authKind === "collaborator" &&
      req.collaboratorId &&
      String(req.query.mine).toLowerCase() === "true"
        ? req.collaboratorId
        : null;

    const result = await Course.getCoursesWithPagination({
      page: page || 1,
      limit: limit || 10,
      search: search || "",
      courseType: effectiveCourseType,
      category: category || null,
      level: effectiveLevel,
      sortBy: sortBy || "createdAt",
      sortOrder: sortOrder || "desc",
      minPrice: minPrice ? parseFloat(minPrice) : null,
      maxPrice: maxPrice ? parseFloat(maxPrice) : null,
      tags: tagsArr,
      isActive: null,
      identifierId: identifierId?.trim?.() || null,
      adminIncludeAll: true,
      filterByCollaboratorId,
    });

    let courses = result.courses;
    if (courses.length) {
      const ids = courses.map((c) => c._id);
      const grouped = await fetchVideosGroupedByCourseIds(ids);
      courses = courses.map((c) => {
        const videos = grouped.get(c._id.toString()) ?? [];
        const base = {
          ...c,
          videoCount: videos.length,
          videos,
        };
        return enrichCourseCollaborator(applyWatchPolicyToCourse(base, FULL_LISTING_ACCESS));
      });
      courses = await attachUserCourseFlags(courses, req.userId);
      courses = courses.map(attachCourseTypeName);
      courses = await attachCourseRatingsForCourses(courses);
    }

    const totalVideosOnPage = courses.reduce(
      (sum, c) => sum + (c.videosCount ?? c.videoCount ?? 0),
      0
    );

    return { ...result, courses, totalVideosOnPage };
  } catch (err) {
    throw err;
  }
};

const getCourseById = async (req) => {
  try {
    const { id } = req.params;
    const course = await Course.findById(id).populate(courseCollaboratorPopulate).lean();

    if (!course) {
      throw new Error("Course not found");
    }

    if (course.isDeleted) {
      throw new Error("Course not found");
    }

    const videos = await fetchVideosForCourse(id);
    const base = {
      ...course,
      videoCount: videos.length,
      videos,
    };
    const withPolicy = applyWatchPolicyToCourse(base, FULL_LISTING_ACCESS);
    const [flagged] = await attachUserCourseFlags([withPolicy], req.userId);
    const enriched = enrichCourseCollaborator(flagged);
    const [withRatings] = await attachCourseRatingsForCourses([enriched]);
    return attachCourseTypeName(withRatings);
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
    const grouped = await fetchVideosGroupedByCourseIds(ids);
    let list = similar.map((c) => {
      const videos = grouped.get(c._id.toString()) ?? [];
      const base = {
        ...c,
        videoCount: videos.length,
        videos,
      };
      return enrichCourseCollaborator(applyWatchPolicyToCourse(base, FULL_LISTING_ACCESS));
    });
    list = await attachUserCourseFlags(list, req.userId);
    list = list.map(attachCourseTypeName);
    list = await attachCourseRatingsForCourses(list);
    return list;
  } catch (err) {
    throw err;
  }
};

const updateCourse = async (req) => {
  try {
    const { id } = req.params;
    const updates = sanitizeCoursePayload(req.body);
    const { courseFields, videos, hasVideos } = splitCourseBody(updates);
    applySequentialOrderToCourseContent(courseFields);

    const existing = await Course.findById(id).select("courseType price").lean();
    if (!existing) {
      throw new Error("Course not found");
    }
    const nextType =
      courseFields.courseType !== undefined
        ? Number(courseFields.courseType)
        : existing.courseType;
    const mergedPrice =
      courseFields.price !== undefined
        ? Number(courseFields.price)
        : Number(existing.price ?? 0);

    if (nextType === 2) {
      courseFields.price = 0;
    } else if (nextType === 1) {
      if (!Number.isFinite(mergedPrice) || mergedPrice <= 0) {
        throw new Error("Paid courses must have a price greater than zero.");
      }
      if (courseFields.price !== undefined) {
        courseFields.price = mergedPrice;
      }
    }

    if (Object.prototype.hasOwnProperty.call(courseFields, "identifierId")) {
      const v = courseFields.identifierId;
      if (v != null && String(v).trim() !== "") {
        await assertIdentifierIdUnique(v, id);
      }
    }
    if (Object.prototype.hasOwnProperty.call(courseFields, "collaborators")) {
      await assertCollaboratorExistsIfSet(courseFields.collaborators);
    }

    if (!hasVideos) {
      try {
        const course = await Course.findByIdAndUpdate(id, courseFields, { new: true });
        if (!course) {
          throw new Error("Course not found");
        }
        return course;
      } catch (err) {
        rethrowDuplicateIdentifierId(err);
      }
    }

    const session = await mongoose.startSession();
    try {
      let course;
      await session.withTransaction(async () => {
        try {
          course = await Course.findByIdAndUpdate(id, courseFields, {
            new: true,
            session,
          });
        } catch (err) {
          rethrowDuplicateIdentifierId(err);
        }
        if (!course) {
          throw new Error("Course not found");
        }
        await replaceCourseVideosForCourse(id, videos ?? [], session);
      });
      return course;
    } finally {
      await session.endSession();
    }
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
    const session = await mongoose.startSession();
    try {
      let course;
      await session.withTransaction(async () => {
        const found = await Course.findById(id).session(session);
        if (!found) {
          throw new Error("Course not found");
        }
        await deleteAllVideosForCourse(id, session);
        await found.deleteOne({ session });
        course = found;
      });
      return course;
    } finally {
      await session.endSession();
    }
  } catch (err) {
    throw err;
  }
};

export const courseService = {
  addCourse,
  getCoursesWithPagination,
  getCoursesWithPaginationAdmin,
  getCourseById,
  getSimilarCourses,
  updateCourse,
  deleteCourse,
  hardDeleteCourse,
};
