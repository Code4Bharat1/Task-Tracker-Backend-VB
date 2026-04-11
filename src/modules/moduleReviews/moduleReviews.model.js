

import mongoose from "mongoose";

const moduleReviewSchema = new mongoose.Schema({
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Module",
    required: true
  },
  reviewerBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  decision: {
    type: String,
    enum: ["pending", "in_progress", "completed"],
    default: "pending"
  },
  feedback: {
    type: String,
    required: true
  },
  reviewedAt: {
    type: Date,
    default: Date.now
  }
});

const ModuleReview = mongoose.model("ModuleReview", moduleReviewSchema);

export default ModuleReview;