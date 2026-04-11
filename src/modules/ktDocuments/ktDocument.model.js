import mongoose from "mongoose";

const ktDocumentSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Module",
      default: null,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      default: "",
    },
    fileUrl: {
      type: String,
      default: null,
    },
    filePublicId: {
      // Cloudinary public_id — needed to delete/replace the file
      type: String,
      default: null,
    },
    fileType: {
      type: String,
      enum: ["pdf", "docx", null],
      default: null,
    },
    fileSize: {
      // bytes
      type: Number,
      default: null,
    },
    tags: {
      type: [String],
      default: [],
    },
    visibility: {
      type: String,
      enum: ["team", "department", "company"],
      default: "team",
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
  }
);

ktDocumentSchema.index({ companyId: 1, projectId: 1 });

export default mongoose.model("KtDocument", ktDocumentSchema);
