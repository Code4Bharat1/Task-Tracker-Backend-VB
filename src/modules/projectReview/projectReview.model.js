import mongoose from "mongoose";

const projectReviewModel = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: true,
    index: true,
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
    index: true,
  },
  testerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true,
    index: true,
  },
  discussion: {
    type: String,
    trim: true,
    lowecase: true
  },
  feedback: {
    type: String,
    trim: true,
    lowecase: true
  },
  reviewedAt: {
    type: Date,
    default: Date(),
    required: true
  },
})

const ProjectReviewModel = mongoose.model("ProjectReview", projectReviewModel)
export default ProjectReviewModel;