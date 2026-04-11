import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    refreshToken: {
      type: String,
      required: true,
    },
    deviceInfo: {
      type: String,
      default: "",
    },
    ipAddress: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
  }
);

sessionSchema.index({ userId: 1, isActive: 1 });
sessionSchema.index({ refreshToken: 1 }, { unique: true });

export default mongoose.model("Session", sessionSchema);
