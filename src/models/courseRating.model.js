import mongoose from "mongoose";

const courseRatingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    review: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
  },
  { timestamps: true }
);

courseRatingSchema.index({ user: 1, course: 1 }, { unique: true });
courseRatingSchema.index({ course: 1 });

const CourseRating = mongoose.model("CourseRating", courseRatingSchema);

export default CourseRating;
