import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
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
		priority: {
			type: String,
			enum: ["LOW", "MEDIUM", "HIGH"],
			default: "MEDIUM",
			index: true,
		},
		status: {
			type: String,
			enum: ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "REJECTED"],
			default: "TODO",
			index: true,
		},
		contributors: [
			{
				userId: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "User",
					required: true,
				},
				assignedAt: {
					type: Date,
					default: Date.now,
				},
				_id: false,
			},
		],
		reviewers: [
			{
				userId: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "User",
					required: true,
				},
				assignedAt: {
					type: Date,
					default: Date.now,
				},
				_id: false,
			},
		],
		completionNote: {
			type: String,
			default: "",
		},
		deadline: {
			type: Date,
			default: null,
		},
		startTime: {
			type: Date,
			default: null,
		},
		endTime: {
			type: Date,
			default: null,
		},
		attachments: [
			{
				url: { type: String, required: true },
				publicId: { type: String, required: true },
				fileName: { type: String, default: "" },
				fileType: { type: String, default: "" },
				uploadedAt: { type: Date, default: Date.now },
				_id: false,
			},
		],
		scoreApplied: {
			type: Boolean,
			default: false,
		},
		completedAt: {
			type: Date,
			default: null,
		},
		created_by: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
	},
	{
		timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
		versionKey: false,
	}
);

taskSchema.index({ companyId: 1, projectId: 1, status: 1 });
taskSchema.index({ companyId: 1, "contributors.userId": 1 });
taskSchema.index({ companyId: 1, "reviewers.userId": 1 });
taskSchema.index({ companyId: 1, scoreApplied: 1, status: 1, deadline: 1 });

export default mongoose.model("Task", taskSchema);
