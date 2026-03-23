import mongoose from "mongoose";

const courseVideoSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Course",
    },
    video_url: {
      type: String,
      trim: true,
    },
    title: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

courseVideoSchema.index({ courseId: 1 });
courseVideoSchema.index({ courseId: 1, order: 1 });
courseVideoSchema.index({ title: 1 });
courseVideoSchema.index({ isActive: 1 });
courseVideoSchema.index({ createdAt: -1 });

courseVideoSchema.statics.getVideosByCourseId = async function (courseId) {
  return await this.find({ courseId, isActive: true })
    .sort({ order: 1 })
    .select("-__v")
    .lean();
};

const CourseVideo = mongoose.model("CourseVideo", courseVideoSchema);

export default CourseVideo;
