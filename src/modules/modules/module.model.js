import mongoose from "mongoose";

const moduleSchema = new mongoose.Schema(
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
		title: {
			type: String,
			required: true,
			trim: true,
		},
		description: {
			type: String,
			default: "",
		},
		sequenceOrder: {
			type: Number,
			default: 0,
		},
		status: {
			type: String,
			enum: [
				"TODO",
				"IN_PROGRESS",
				"DEV_COMPLETE",
				"CODE_REVIEW",
				"QA_TESTING",
				"APPROVED",
				"REJECTED",
				"DEPLOYED",
			],
			default: "TODO",
			index: true,
		},
		assignedTo: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			default: null,
		},
		assignedName: {
			type: String,
			default: "",
		},
		completionNote: {
			type: String,
			default: "",
		},
		deadline: {
			type: Date,
			default: null,
		},
		completedAt: {
			type: Date,
			default: null,
		},
		created_by: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
		},
	},
	{
		timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
		versionKey: false,
	}
);

moduleSchema.index({ companyId: 1, projectId: 1, status: 1 });

export default mongoose.model("Module", moduleSchema);
