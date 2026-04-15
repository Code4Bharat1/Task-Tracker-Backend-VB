import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
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
		action: {
			type: String,
			required: true,
			// e.g. "PROJECT_CREATED", "BUG_ASSIGNED", "TASK_STATUS_CHANGED"
		},
		entity: {
			type: String,
			required: true,
			enum: ["project", "task", "bug", "daily_log", "user", "department", "kt_document"],
			index: true,
		},
		entityId: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
		},
		meta: {
			type: mongoose.Schema.Types.Mixed,
			default: {},
		},
		ipAddress: {
			type: String,
			default: "",
		},
	},
	{
		timestamps: { createdAt: "created_at", updatedAt: false },
		versionKey: false,
	}
);

activityLogSchema.index({ companyId: 1, userId: 1, created_at: -1 });
activityLogSchema.index({ companyId: 1, entity: 1, entityId: 1 });

export default mongoose.model("ActivityLog", activityLogSchema);
