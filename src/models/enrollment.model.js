import mongoose from "mongoose";

const enrollmentSchema = new mongoose.Schema(
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
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
    /** null = lifetime access (no expiry) */
    expiresAt: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    enrollmentType: {
      type: String,
      enum: ["free", "paid"],
      required: true,
    },
    paymentDetails: {
      amount: { type: Number, default: 0 },
      paymentMethod: { type: String, default: null },
      transactionId: { type: String, default: null },
      paymentDate: { type: Date, default: null },
    },
    progress: {
      completedLessonOrders: [{ type: Number }],
      lastAccessedAt: { type: Date, default: Date.now },
      completionPercentage: { type: Number, default: 0, min: 0, max: 100 },
    },
  },
  {
    timestamps: true,
  }
);

enrollmentSchema.index({ user: 1 });
enrollmentSchema.index({ course: 1 });
enrollmentSchema.index({ enrolledAt: -1 });
enrollmentSchema.index({ expiresAt: 1 });
enrollmentSchema.index({ isActive: 1 });
enrollmentSchema.index({ user: 1, course: 1 }, { unique: true });

enrollmentSchema.statics.getUserEnrollments = async function (userId) {
  const now = new Date();
  return await this.find({
    user: userId,
    isActive: true,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
  })
    .populate({
      path: "course",
      select:
        "title description thumbnail duration level category courseType price courseContent isDeleted tags benefits prerequisites learningOutcomes isActive rating enrollmentCount",
    })
    .sort({ enrolledAt: -1 })
    .lean();
};

enrollmentSchema.pre("save", async function (next) {
  if (this.isNew) {
    this.expiresAt = null;
    try {
      const Course = mongoose.model("Course");
      const course = await Course.findById(this.course);
      if (course) {
        this.enrollmentType = course.courseType === 1 ? "paid" : "free";
        if (course.courseType === 1) {
          this.paymentDetails = this.paymentDetails || {};
          this.paymentDetails.amount = course.price;
        }
      }
    } catch (error) {
      console.error("Error setting enrollment type:", error);
    }
  }
  next();
});

const Enrollment = mongoose.model("Enrollment", enrollmentSchema);

export default Enrollment;
