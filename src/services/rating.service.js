import mongoose from "mongoose";
import CourseRating from "../models/courseRating.model.js";
import Course from "../models/course.model.js";
import Enrollment from "../models/enrollment.model.js";
import { enrollmentActiveMatch } from "../utils/courseAccess.js";

/**
 * Recompute Course.rating.average and rating.count from all CourseRating docs.
 */
export async function syncCourseRatingAggregate(courseId) {
  const oid = new mongoose.Types.ObjectId(String(courseId));
  const agg = await CourseRating.aggregate([
    { $match: { course: oid } },
    {
      $group: {
        _id: null,
        avg: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);
  const avg = agg[0]?.avg ?? 0;
  const count = agg[0]?.count ?? 0;
  const rounded = Math.round(avg * 10) / 10;
  await Course.findByIdAndUpdate(courseId, {
    "rating.average": rounded,
    "rating.count": count,
  });
}

/**
 * Upsert user's rating/review for a course (must be actively enrolled).
 */
export async function upsertCourseRating(req) {
  const userId = req.userId;
  const { courseId } = req.params;
  const { rating, review } = req.body;

  const course = await Course.findById(courseId).lean();
  if (!course || course.isDeleted) {
    throw new Error("Course not found");
  }

  const enrollment = await Enrollment.findOne({
    user: userId,
    course: courseId,
    ...enrollmentActiveMatch(),
  }).lean();

  if (!enrollment) {
    throw new Error("You must be enrolled in this course to rate it");
  }

  const reviewText = typeof review === "string" ? review.trim() : "";

  await CourseRating.findOneAndUpdate(
    { user: userId, course: courseId },
    {
      $set: {
        rating: Number(rating),
        review: reviewText,
      },
    },
    { upsert: true, new: true }
  );

  await syncCourseRatingAggregate(courseId);

  const doc = await CourseRating.findOne({
    user: userId,
    course: courseId,
  }).lean();

  return {
    courseId: doc.course.toString(),
    rating: doc.rating,
    review: doc.review,
    updatedAt: doc.updatedAt,
  };
}

/**
 * Batch: attach myRating { rating, review, updatedAt } per course for a user.
 */
export async function attachMyRatingsToEnrollments(enrollments, userId) {
  if (!enrollments?.length || !userId) {
    return enrollments?.map((e) => ({ ...e, myRating: null })) ?? [];
  }
  const courseIds = enrollments.map((e) => e.course?._id).filter(Boolean);
  if (!courseIds.length) {
    return enrollments.map((e) => ({ ...e, myRating: null }));
  }

  const ratings = await CourseRating.find({
    user: userId,
    course: { $in: courseIds },
  }).lean();
  const map = new Map(ratings.map((r) => [r.course.toString(), r]));

  return enrollments.map((e) => {
    const r = e.course?._id && map.get(e.course._id.toString());
    return {
      ...e,
      myRating: r
        ? {
            rating: r.rating,
            review: r.review,
            updatedAt: r.updatedAt,
          }
        : null,
    };
  });
}

/**
 * For course list / detail / similar: isEnrolled + myRating when userId present.
 */
export async function attachUserCourseFlags(courses, userId) {
  if (!courses?.length) return courses;
  if (!userId) {
    return courses.map((c) => ({
      ...c,
      isEnrolled: false,
      myRating: null,
    }));
  }

  const ids = courses.map((c) => c._id);
  const now = new Date();

  const [enrollRows, ratingRows] = await Promise.all([
    Enrollment.find({
      user: userId,
      course: { $in: ids },
      isActive: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    })
      .select("course")
      .lean(),
    CourseRating.find({ user: userId, course: { $in: ids } }).lean(),
  ]);

  const enrolledSet = new Set(enrollRows.map((e) => e.course.toString()));
  const ratingMap = new Map(ratingRows.map((r) => [r.course.toString(), r]));

  return courses.map((c) => {
    const id = c._id.toString();
    const r = ratingMap.get(id);
    return {
      ...c,
      isEnrolled: enrolledSet.has(id),
      myRating: r
        ? {
            rating: r.rating,
            review: r.review,
            updatedAt: r.updatedAt,
          }
        : null,
    };
  });
}

function formatCourseRatingRow(r) {
  const u = r.user;
  return {
    _id: r._id,
    course: r.course,
    rating: r.rating,
    review: r.review ?? "",
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    user: u
      ? {
          _id: u._id,
          userName: u.userName ?? null,
          profileImage: u.profileImage ?? null,
        }
      : null,
  };
}

/**
 * Attach all CourseRating rows per course (newest first). Safe user subset only.
 */
export async function attachCourseRatingsForCourses(courses) {
  if (!courses?.length) return courses;
  const ids = courses.map((c) => c._id).filter(Boolean);
  if (!ids.length) return courses;

  const rows = await CourseRating.find({ course: { $in: ids } })
    .populate({
      path: "user",
      select: "userName profileImage",
    })
    .sort({ updatedAt: -1 })
    .lean();

  const byCourse = new Map();
  for (const id of ids) {
    byCourse.set(id.toString(), []);
  }
  for (const r of rows) {
    const key = r.course.toString();
    if (!byCourse.has(key)) byCourse.set(key, []);
    byCourse.get(key).push(formatCourseRatingRow(r));
  }

  return courses.map((c) => ({
    ...c,
    courseRatings: byCourse.get(c._id.toString()) ?? [],
  }));
}

const notDeleted = { isDeleted: false };

function assertCollaborator(req) {
  if (req.authKind !== "collaborator") {
    const e = new Error("Only collaborator accounts can access this resource");
    e.statusCode = 403;
    throw e;
  }
  const raw = req.collaboratorId;
  if (!raw || !mongoose.Types.ObjectId.isValid(String(raw))) {
    const e = new Error("Invalid collaborator session");
    e.statusCode = 403;
    throw e;
  }
  return new mongoose.Types.ObjectId(String(raw));
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

/**
 * Analytics across all ratings on courses owned by this collaborator (`course.collaborators`).
 */
export async function getCollaboratorRatingOverview(req) {
  const collabOid = assertCollaborator(req);
  const myCourseIds = await Course.find({
    ...notDeleted,
    collaborators: collabOid,
  }).distinct("_id");

  if (!myCourseIds.length) {
    return {
      totalReviews: 0,
      averageRating: 0,
      coursesWithReviews: 0,
      totalCourses: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }

  const totalCourses = myCourseIds.length;
  const match = { course: { $in: myCourseIds } };

  const [agg, distRows, coursesWithReviews] = await Promise.all([
    CourseRating.aggregate([
      { $match: match },
      { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]),
    CourseRating.aggregate([
      { $match: match },
      { $group: { _id: "$rating", n: { $sum: 1 } } },
    ]),
    CourseRating.distinct("course", match),
  ]);

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const row of distRows) {
    const k = Number(row._id);
    if (k >= 1 && k <= 5) distribution[k] = row.n;
  }

  const totalReviews = agg[0]?.count ?? 0;
  const averageRating =
    totalReviews > 0 ? Math.round((agg[0].avg ?? 0) * 100) / 100 : 0;

  return {
    totalReviews,
    averageRating,
    coursesWithReviews: coursesWithReviews.length,
    totalCourses,
    distribution,
  };
}

/** Paginated courses this collaborator owns (for ratings UI). */
export async function listCollaboratorCoursesForRatings(req) {
  const collabOid = assertCollaborator(req);
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const base = { ...notDeleted, collaborators: collabOid };
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const query = { ...base };
  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const rx = new RegExp(escaped, "i");
    query.$or = [{ title: rx }, { category: rx }, { identifierId: rx }];
  }

  const [courses, total] = await Promise.all([
    Course.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("title category thumbnail rating identifierId isActive")
      .lean(),
    Course.countDocuments(query),
  ]);

  return {
    courses: courses.map((c) => ({
      _id: c._id,
      title: c.title,
      category: c.category,
      thumbnail: c.thumbnail ?? null,
      identifierId: c.identifierId ?? null,
      isActive: c.isActive !== false,
      rating: c.rating ?? { average: 0, count: 0 },
    })),
    pagination: paginationMeta(page, limit, total),
  };
}

/**
 * Paginated reviews for one course; collaborator must own the course.
 */
export async function listReviewsForCollaboratorCourse(req) {
  const collabOid = assertCollaborator(req);
  const { courseId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(String(courseId))) {
    const e = new Error("Invalid course id");
    e.statusCode = 400;
    throw e;
  }

  const course = await Course.findOne({
    _id: courseId,
    ...notDeleted,
    collaborators: collabOid,
  })
    .select("title category rating")
    .lean();

  if (!course) {
    const e = new Error("Course not found or you do not manage this course");
    e.statusCode = 404;
    throw e;
  }

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 15));
  const skip = (page - 1) * limit;

  const filter = { course: courseId };

  const [rows, total, summaryAgg, distRows] = await Promise.all([
    CourseRating.find(filter)
      .populate({ path: "user", select: "userName profileImage" })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    CourseRating.countDocuments(filter),
    CourseRating.aggregate([
      { $match: { course: new mongoose.Types.ObjectId(String(courseId)) } },
      { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]),
    CourseRating.aggregate([
      { $match: { course: new mongoose.Types.ObjectId(String(courseId)) } },
      { $group: { _id: "$rating", n: { $sum: 1 } } },
    ]),
  ]);

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const row of distRows) {
    const k = Number(row._id);
    if (k >= 1 && k <= 5) distribution[k] = row.n;
  }

  const count = summaryAgg[0]?.count ?? 0;
  const avg = count > 0 ? Math.round((summaryAgg[0].avg ?? 0) * 100) / 100 : 0;

  return {
    course: {
      _id: course._id,
      title: course.title,
      category: course.category,
      rating: course.rating ?? { average: 0, count: 0 },
    },
    summary: {
      averageRating: avg,
      totalReviews: count,
      distribution,
    },
    reviews: rows.map((r) => formatCourseRatingRow(r)),
    pagination: paginationMeta(page, limit, total),
  };
}

/** Remove a learner's rating/review; collaborator must own the course. */
export async function deleteReviewByCollaborator(req) {
  const collabOid = assertCollaborator(req);
  const { ratingId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(String(ratingId))) {
    const e = new Error("Invalid rating id");
    e.statusCode = 400;
    throw e;
  }

  const rating = await CourseRating.findById(ratingId).lean();
  if (!rating) {
    const e = new Error("Review not found");
    e.statusCode = 404;
    throw e;
  }

  const course = await Course.findOne({
    _id: rating.course,
    ...notDeleted,
    collaborators: collabOid,
  })
    .select("_id")
    .lean();

  if (!course) {
    const e = new Error("Not allowed to delete this review");
    e.statusCode = 403;
    throw e;
  }

  await CourseRating.deleteOne({ _id: ratingId });
  await syncCourseRatingAggregate(rating.course);

  return { deleted: true, courseId: String(rating.course) };
}
