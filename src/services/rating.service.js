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
