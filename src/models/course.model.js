import mongoose from "mongoose";
import CourseVideo from "./courseVideo.model.js";

/** Safe Collaborator fields on course APIs (password never selected). */
export const courseCollaboratorPopulate = {
  path: "collaborators",
  select: "name profile coverProfile phoneNumber email profession address",
};

const courseContentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    videoUrl: {
      type: String,
      trim: true,
    },
    duration: {
      type: String,
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    isPreview: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

const courseSchema = new mongoose.Schema(
  {
    collaborators: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Collaborator",
      default: null,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    identifierId: {
      type: String,
      trim: true,
      maxlength: 256,
      default: null,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    /** 1 = paid (requires price), 2 = free — see `courseTypeName` virtual */
    courseType: {
      type: Number,
      enum: [1, 2],
      required: true,
    },
    price: {
      type: Number,
      required: function () {
        return this.courseType === 1;
      },
      min: 0,
      default: 0,
    },
    benefits: [
      {
        type: String,
        trim: true,
        maxlength: 500,
      },
    ],
    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    thumbnail: {
      type: String,
      trim: true,
      default: null,
    },
    duration: {
      type: String,
      trim: true,
    },
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    enrollmentCount: {
      type: Number,
      default: 0,
    },
    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
    courseContent: [courseContentSchema],
    prerequisites: [
      {
        type: String,
        trim: true,
      },
    ],
    learningOutcomes: [
      {
        type: String,
        trim: true,
        maxlength: 300,
      },
    ],
  },
  {
    timestamps: true,
  }
);

courseSchema.index({ title: 1 });
/** Unique among courses that set a non-empty identifierId (null/omitted allowed for many rows). */
courseSchema.index(
  { identifierId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      identifierId: { $exists: true, $nin: [null, ""] },
    },
  }
);
courseSchema.index({ category: 1 });
courseSchema.index({ tags: 1 });
courseSchema.index({ courseType: 1 });
courseSchema.index({ isActive: 1 });
courseSchema.index({ isDeleted: 1 });
courseSchema.index({ createdAt: -1 });

courseSchema.virtual("courseTypeName").get(function () {
  return this.courseType === 1 ? "paid" : "free";
});

courseSchema.set("toJSON", { virtuals: true });
courseSchema.set("toObject", { virtuals: true });

/** Escape user input for use inside MongoDB `$regexMatch` / RegExp (literal match). */
function escapeRegexForSearch(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const SEARCH_SORT_WHITELIST = new Set([
  "createdAt",
  "updatedAt",
  "title",
  "price",
  "enrollmentCount",
  "rating.average",
]);

courseSchema.statics.getCoursesWithPagination = async function (options = {}) {
  const {
    page = 1,
    limit = 10,
    search = "",
    courseType = null,
    category = null,
    level = null,
    sortBy = "createdAt",
    sortOrder = "desc",
    minPrice = null,
    maxPrice = null,
    tags = null,
    isActive = null,
    identifierId = null,
    adminIncludeAll = false,
    /** When set, only courses owned by this collaborator (`collaborators` ref). */
    filterByCollaboratorId = null,
  } = options;

  const query = adminIncludeAll ? {} : { isDeleted: false };

  if (filterByCollaboratorId != null && String(filterByCollaboratorId).trim() !== "") {
    query.collaborators = filterByCollaboratorId;
  }

  if (!adminIncludeAll) {
    if (isActive !== null) {
      query.isActive = isActive;
    } else {
      query.isActive = true;
    }
  }

  if (courseType !== null) query.courseType = courseType;
  if (category) query.category = new RegExp(category, "i");
  if (level) query.level = level;

  if (minPrice !== null || maxPrice !== null) {
    query.price = {};
    if (minPrice !== null) query.price.$gte = minPrice;
    if (maxPrice !== null) query.price.$lte = maxPrice;
  }

  if (tags && tags.length > 0) {
    query.tags = { $in: tags };
  }

  if (identifierId) {
    query.identifierId = identifierId.trim();
  }

  const skip = (page - 1) * limit;
  const lim = parseInt(limit, 10);
  const pg = parseInt(page, 10);
  const sortCol = SEARCH_SORT_WHITELIST.has(sortBy) ? sortBy : "createdAt";
  const sortDir = sortOrder === "desc" ? -1 : 1;
  const sortOptions = {};
  sortOptions[sortCol] = sortDir;

  const searchTrimmed = search && String(search).trim();

  let matchQuery = query;
  let searchPattern = "";
  let videoCourseIdsForSearch = [];

  if (searchTrimmed) {
    searchPattern = escapeRegexForSearch(searchTrimmed);
    const re = new RegExp(searchPattern, "i");
    videoCourseIdsForSearch = await CourseVideo.distinct("courseId", {
      isActive: true,
      $or: [{ title: re }, { description: re }],
    });
    matchQuery = {
      ...query,
      $or: [
        { title: re },
        { description: re },
        { tags: re },
        { category: re },
        { identifierId: re },
        { "courseContent.title": re },
        { "courseContent.description": re },
        ...(videoCourseIdsForSearch.length
          ? [{ _id: { $in: videoCourseIdsForSearch } }]
          : []),
      ],
    };
  }

  const total = await this.countDocuments(matchQuery);

  let courses;
  if (searchTrimmed) {
    const pattern = searchPattern;

    const rankExpr = {
      $cond: [
        {
          $regexMatch: {
            input: { $toString: { $ifNull: ["$title", ""] } },
            regex: pattern,
            options: "i",
          },
        },
        1,
        {
          $cond: [
            {
              $regexMatch: {
                input: { $toString: { $ifNull: ["$description", ""] } },
                regex: pattern,
                options: "i",
              },
            },
            2,
            {
              $cond: [
                {
                  $gt: [
                    {
                      $size: {
                        $filter: {
                          input: { $ifNull: ["$tags", []] },
                          as: "t",
                          cond: {
                            $regexMatch: {
                              input: { $toString: "$$t" },
                              regex: pattern,
                              options: "i",
                            },
                          },
                        },
                      },
                    },
                    0,
                  ],
                },
                3,
                {
                  $cond: [
                    {
                      $or: [
                        {
                          $gt: [
                            {
                              $size: {
                                $filter: {
                                  input: { $ifNull: ["$courseContent", []] },
                                  as: "c",
                                  cond: {
                                    $or: [
                                      {
                                        $regexMatch: {
                                          input: {
                                            $toString: { $ifNull: ["$$c.title", ""] },
                                          },
                                          regex: pattern,
                                          options: "i",
                                        },
                                      },
                                      {
                                        $regexMatch: {
                                          input: {
                                            $toString: {
                                              $ifNull: ["$$c.description", ""],
                                            },
                                          },
                                          regex: pattern,
                                          options: "i",
                                        },
                                      },
                                    ],
                                  },
                                },
                              },
                            },
                            0,
                          ],
                        },
                        { $in: ["$_id", videoCourseIdsForSearch] },
                      ],
                    },
                    4,
                    5,
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    const sortStage = { _searchRank: 1, [sortCol]: sortDir, _id: 1 };

    const pipeline = [
      { $match: matchQuery },
      { $addFields: { _searchRank: rankExpr } },
      { $sort: sortStage },
      { $skip: skip },
      { $limit: lim },
      { $project: { _searchRank: 0 } },
    ];

    const ordered = await this.aggregate(pipeline);
    const ids = ordered.map((d) => d._id);
    if (!ids.length) {
      courses = [];
    } else {
      const byId = await this.find({ _id: { $in: ids } })
        .populate(courseCollaboratorPopulate)
        .lean();
      const map = new Map(byId.map((c) => [c._id.toString(), c]));
      courses = ids.map((id) => map.get(id.toString())).filter(Boolean);
    }
  } else {
    courses = await this.find(matchQuery)
      .populate(courseCollaboratorPopulate)
      .sort(sortOptions)
      .skip(skip)
      .limit(lim)
      .lean();
  }

  return {
    courses,
    pagination: {
      currentPage: pg,
      pageSize: lim,
      totalPages: Math.ceil(total / lim) || 0,
      totalCourses: total,
      hasNextPage: pg < Math.ceil(total / lim),
      hasPrevPage: pg > 1,
    },
  };
};

courseSchema.statics.getSimilarCourses = async function (courseId, category, limit = 5) {
  return await this.find({
    _id: { $ne: courseId },
    category: new RegExp(category, "i"),
    isActive: true,
    isDeleted: false,
  })
    .populate(courseCollaboratorPopulate)
    .limit(limit)
    .sort({ enrollmentCount: -1, "rating.average": -1 })
    .lean();
};

const Course = mongoose.model("Course", courseSchema);

export default Course;
