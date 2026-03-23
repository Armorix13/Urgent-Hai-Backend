import mongoose from "mongoose";

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
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
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
  } = options;

  const query = { isDeleted: false };

  if (isActive !== null) {
    query.isActive = isActive;
  } else {
    query.isActive = true;
  }

  if (search) {
    const searchRegex = new RegExp(search, "i");
    query.$or = [
      { title: searchRegex },
      { description: searchRegex },
      { category: searchRegex },
      { tags: { $in: [searchRegex] } },
    ];
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

  const skip = (page - 1) * limit;
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

  const courses = await this.find(query)
    .sort(sortOptions)
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const total = await this.countDocuments(query);

  return {
    courses,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalCourses: total,
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
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
    .limit(limit)
    .sort({ enrollmentCount: -1, "rating.average": -1 })
    .lean();
};

const Course = mongoose.model("Course", courseSchema);

export default Course;
