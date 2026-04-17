import mongoose from "mongoose";

const entrySchema = new mongoose.Schema(
	{
		projectId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Project",
			required: true,
		},
		taskId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Task",
			default: null,
		},
		logType: {
			type: String,
			enum: ["task_work", "meeting", "ad_hoc", "review"],
			default: "task_work",
		},
		startTime: {
			type: String, // "HH:MM" format
			default: null,
		},
		endTime: {
			type: String, // "HH:MM" format
			default: null,
		},
		description: {
			type: String,
			required: true,
			trim: true,
		},
		screenshotUrl: {
			type: String,
			default: null,
		},
	},
	{ _id: true, versionKey: false }
);

const dailyLogSchema = new mongoose.Schema(
	{
		companyId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Company",
			required: true,
			index: true,
		},
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		logDate: {
			type: Date,
			required: true,
		},
		entries: {
			type: [entrySchema],
			validate: {
				validator: (v) => Array.isArray(v) && v.length > 0,
				message: "At least one entry is required.",
			},
		},
	},
	{
		timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
		versionKey: false,
	}
);

// One log document per user per day
dailyLogSchema.index({ companyId: 1, userId: 1, logDate: 1 }, { unique: true });

export default mongoose.model("DailyLog", dailyLogSchema);
