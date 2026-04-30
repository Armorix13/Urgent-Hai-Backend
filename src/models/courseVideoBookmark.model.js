import mongoose from "mongoose";

const courseVideoBookmarkSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    courseVideoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseVideo",
      required: true,
      index: true,
    },
    note: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
    },
  },
  { timestamps: true }
);

courseVideoBookmarkSchema.index({ userId: 1, courseVideoId: 1 }, { unique: true });
courseVideoBookmarkSchema.index({ userId: 1, updatedAt: -1 });

const CourseVideoBookmark = mongoose.model("CourseVideoBookmark", courseVideoBookmarkSchema);

export default CourseVideoBookmark;
