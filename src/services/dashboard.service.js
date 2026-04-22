import mongoose from "mongoose";
import Course from "../models/course.model.js";
import Enrollment from "../models/enrollment.model.js";
import CourseRating from "../models/courseRating.model.js";

const notDeleted = { isDeleted: false };

/** Matches active learner seats (same idea as user enrollment lists). */
const activeEnrollmentFilter = {
  isActive: true,
  $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
};

/** Course model stores the owning collaborator on `collaborators` (same id as login / API `collaboratorId`). */
function collaboratorCourseMatch(collabOid) {
  return { ...notDeleted, collaborators: collabOid };
}

function startOfUtcDay(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

/** Week starts Monday 00:00 UTC. */
function startOfUtcWeekMonday(d = new Date()) {
  const x = new Date(d);
  const dow = x.getUTCDay();
  const daysFromMon = (dow + 6) % 7;
  x.setUTCDate(x.getUTCDate() - daysFromMon);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function startOfUtcMonth(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0));
}

async function countActiveEnrollmentsForCourseIds(courseIds) {
  if (!courseIds?.length) return 0;
  return Enrollment.countDocuments({
    ...activeEnrollmentFilter,
    course: { $in: courseIds },
  });
}

async function countAllActiveEnrollments() {
  return Enrollment.countDocuments(activeEnrollmentFilter);
}

async function aggregateCourseStats(extraMatch = {}) {
  const match = { ...notDeleted, ...extraMatch };
  const [row] = await Course.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalCourses: { $sum: 1 },
        /** Align with schema default `true`: only explicit `false` is inactive (missing/null counts as active). */
        activeCourses: {
          $sum: { $cond: [{ $eq: ["$isActive", false] }, 0, 1] },
        },
      },
    },
  ]);
  return {
    totalCourses: row?.totalCourses ?? 0,
    activeCourses: row?.activeCourses ?? 0,
  };
}

async function countCoursesCreatedSince(collabOid, since) {
  return Course.countDocuments({
    ...collaboratorCourseMatch(collabOid),
    createdAt: { $gte: since },
  });
}

async function aggregateRatingStatsForCourseIds(courseIds) {
  if (!courseIds?.length) return { count: 0, average: 0 };
  const [row] = await CourseRating.aggregate([
    { $match: { course: { $in: courseIds } } },
    { $group: { _id: null, count: { $sum: 1 }, avg: { $avg: "$rating" } } },
  ]);
  const avg = row?.avg ?? 0;
  return {
    count: row?.count ?? 0,
    average: Math.round(avg * 100) / 100,
  };
}

function utcDayKeys(days) {
  const keys = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    d.setUTCHours(0, 0, 0, 0);
    keys.push(d.toISOString().slice(0, 10));
  }
  return keys;
}

function emptyTrend(days) {
  return utcDayKeys(days).map((date) => ({ date, count: 0 }));
}

/**
 * @param {{ courseIds?: import('mongoose').Types.ObjectId[]; days?: number; allCourses?: boolean }} opts
 */
async function enrollmentLastDays(opts) {
  const { courseIds, days = 7, allCourses = false } = opts;
  const keys = utcDayKeys(days);
  const start = new Date(`${keys[0]}T00:00:00.000Z`);
  const match = {
    enrolledAt: { $gte: start },
    isActive: true,
  };
  if (!allCourses) {
    if (!courseIds?.length) {
      return keys.map((date) => ({ date, count: 0 }));
    }
    match.course = { $in: courseIds };
  }

  const rows = await Enrollment.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$enrolledAt", timezone: "UTC" },
        },
        count: { $sum: 1 },
      },
    },
  ]);
  const byDay = new Map(rows.map((r) => [r._id, r.count]));
  return keys.map((date) => ({ date, count: byDay.get(date) ?? 0 }));
}

function formatEnrollmentRow(e) {
  return {
    _id: e._id,
    enrolledAt: e.enrolledAt,
    course: e.course
      ? {
          _id: e.course._id,
          title: e.course.title,
          category: e.course.category,
          thumbnail: e.course.thumbnail ?? null,
        }
      : null,
    user: e.user
      ? {
          userName: e.user.userName ?? null,
          profileImage: e.user.profileImage ?? null,
        }
      : null,
  };
}

function formatRatingRow(r) {
  return {
    _id: r._id,
    rating: r.rating,
    review: r.review,
    updatedAt: r.updatedAt,
    course: r.course
      ? { _id: r.course._id, title: r.course.title, category: r.course.category }
      : null,
    user: r.user
      ? {
          userName: r.user.userName ?? null,
          profileImage: r.user.profileImage ?? null,
        }
      : null,
  };
}

function mapTopRatedLean(courses) {
  return courses.map((c) => ({
    _id: c._id,
    title: c.title,
    category: c.category,
    rating: c.rating,
    enrollmentCount: c.enrollmentCount ?? 0,
    thumbnail: c.thumbnail ?? null,
  }));
}

async function loadTopRatedCourses(matchExtra = {}) {
  const rows = await Course.find({
    ...notDeleted,
    isActive: true,
    "rating.count": { $gte: 1 },
    ...matchExtra,
  })
    .sort({ "rating.average": -1, "rating.count": -1 })
    .limit(5)
    .select("title category rating enrollmentCount thumbnail")
    .lean();
  return mapTopRatedLean(rows);
}

function emptyCollaboratorMine() {
  return {
    totalCourses: 0,
    activeCourses: 0,
    totalEnrollments: 0,
    coursesAddedToday: 0,
    coursesAddedThisWeek: 0,
    coursesAddedThisMonth: 0,
    ratingsReceived: 0,
    ratingsAverage: 0,
  };
}

async function getCollaboratorDashboard(collabOid) {
  const platformStats = await aggregateCourseStats({});
  const platform = {
    ...platformStats,
    totalEnrollments: await countAllActiveEnrollments(),
  };
  const trendPlatform = await enrollmentLastDays({ allCourses: true, days: 7 });

  if (!collabOid) {
    return {
      authKind: "collaborator",
      platform,
      mine: emptyCollaboratorMine(),
      enrollmentTrend: { platform: trendPlatform, mine: emptyTrend(7) },
      recentEnrollments: [],
      recentRatings: [],
      topRatedCourses: [],
    };
  }

  const myMatch = collaboratorCourseMatch(collabOid);
  const myCourseIds = await Course.find(myMatch).distinct("_id");
  const mineStats = await aggregateCourseStats(myMatch);
  const totalEnrollments = await countActiveEnrollmentsForCourseIds(myCourseIds);
  const ratingAgg = await aggregateRatingStatsForCourseIds(myCourseIds);

  const now = new Date();
  const [coursesAddedToday, coursesAddedThisWeek, coursesAddedThisMonth] = await Promise.all([
    countCoursesCreatedSince(collabOid, startOfUtcDay(now)),
    countCoursesCreatedSince(collabOid, startOfUtcWeekMonday(now)),
    countCoursesCreatedSince(collabOid, startOfUtcMonth(now)),
  ]);

  const trendMine =
    myCourseIds.length > 0
      ? await enrollmentLastDays({ courseIds: myCourseIds, days: 7 })
      : emptyTrend(7);

  let recentEnrollments = [];
  if (myCourseIds.length) {
    const rows = await Enrollment.find({
      course: { $in: myCourseIds },
      isActive: true,
    })
      .sort({ enrolledAt: -1 })
      .limit(5)
      .populate("course", "title category thumbnail")
      .populate("user", "userName profileImage")
      .lean();
    recentEnrollments = rows.map(formatEnrollmentRow);
  }

  let recentRatings = [];
  if (myCourseIds.length) {
    const rows = await CourseRating.find({ course: { $in: myCourseIds } })
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate("user", "userName profileImage")
      .populate("course", "title category")
      .lean();
    recentRatings = rows.map(formatRatingRow);
  }

  const topRatedCourses = await loadTopRatedCourses(
    myCourseIds.length ? { _id: { $in: myCourseIds } } : { _id: { $in: [] } },
  );

  return {
    authKind: "collaborator",
    platform,
    mine: {
      ...mineStats,
      totalEnrollments,
      coursesAddedToday,
      coursesAddedThisWeek,
      coursesAddedThisMonth,
      ratingsReceived: ratingAgg.count,
      ratingsAverage: ratingAgg.average,
    },
    enrollmentTrend: {
      platform: trendPlatform,
      mine: trendMine,
    },
    recentEnrollments,
    recentRatings,
    topRatedCourses,
  };
}

async function getLearnerDashboard(userId) {
  const platformStats = await aggregateCourseStats({});
  const platform = {
    ...platformStats,
    totalEnrollments: await countAllActiveEnrollments(),
  };

  const trendPlatform = await enrollmentLastDays({ allCourses: true, days: 7 });

  let recentEnrollments = [];
  if (userId) {
    const rows = await Enrollment.find({
      user: userId,
      isActive: true,
    })
      .sort({ enrolledAt: -1 })
      .limit(5)
      .populate("course", "title category thumbnail")
      .lean();
    recentEnrollments = rows.map(formatEnrollmentRow);
  }

  const ratingRows = await CourseRating.find({})
    .sort({ updatedAt: -1 })
    .limit(5)
    .populate("user", "userName profileImage")
    .populate("course", "title category")
    .lean();
  const recentRatings = ratingRows.map(formatRatingRow);

  const topRatedCourses = await loadTopRatedCourses({});

  return {
    authKind: "user",
    platform,
    mine: null,
    enrollmentTrend: {
      platform: trendPlatform,
      mine: null,
    },
    recentEnrollments,
    recentRatings,
    topRatedCourses,
  };
}

export async function getDashboardAnalytics(req) {
  if (req.authKind === "collaborator") {
    const collaboratorRaw = req.collaboratorId;
    const collabOid =
      collaboratorRaw && mongoose.Types.ObjectId.isValid(String(collaboratorRaw))
        ? new mongoose.Types.ObjectId(String(collaboratorRaw))
        : null;
    return getCollaboratorDashboard(collabOid);
  }

  return getLearnerDashboard(req.userId);
}
