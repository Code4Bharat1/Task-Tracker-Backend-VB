import mongoose from "mongoose";

const bugSchema = new mongoose.Schema(
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
		description: {
			type: String,
			default: "",
		},
		severity: {
			type: String,
			enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
			default: "MEDIUM",
			index: true,
		},
		status: {
			type: String,
			enum: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED", "REOPENED"],
			default: "OPEN",
			index: true,
		},
		reportedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		assignedTo: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			default: null,
		},
		resolvedAt: {
			type: Date,
			default: null,
		},
		stepsToReproduce: {
			type: String,
			default: "",
		},
		attachmentUrl: {
			type: String,
			default: null,
		},
	},
	{
		timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
		versionKey: false,
	}
);

bugSchema.index({ companyId: 1, projectId: 1, status: 1 });
bugSchema.index({ companyId: 1, assignedTo: 1, status: 1 });

export default mongoose.model("Bug", bugSchema);
