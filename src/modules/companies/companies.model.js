import mongoose, { Schema } from "mongoose";

const permissionSchema = new Schema({
	create: { type: Boolean, default: true },
	read:   { type: Boolean, default: true },
	update: { type: Boolean, default: true },
	delete: { type: Boolean, default: false },
}, { _id: false });

const rolePermissionsSchema = new Schema({
	users:        permissionSchema,
	projects:     permissionSchema,
	tasks:        permissionSchema,
	dailyLogs:    permissionSchema,
	bugs:         permissionSchema,
	reports:      permissionSchema,
	ktDocuments:  permissionSchema,
	leaderboard:  permissionSchema,
	activityLogs: permissionSchema,
}, { _id: false });

const companySchema = new Schema(
	{
		companyName: {
			type: String,
			required: true,
			trim: true,
			index: true,
		},
		status: {
			type: String,
			enum: ["active", "inactive"],
			default: "active",
			index: true,
		},
		workingDays: {
			type: [String],
			enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
			default: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
		},
		shiftStart: { type: String, default: "09:00" },
		shiftEnd:   { type: String, default: "18:00" },
		logDeadlines: { type: [String], default: ["22:00"] },
		defaultTaskDeadline: { type: String, default: "20:00" },
		missedTaskGracePeriod: { type: Number, default: 24 },
		scoringRules: {
			taskOnTime:     { type: Number, default: 2 },
			taskEarly:      { type: Number, default: 3 },
			taskOverdue:    { type: Number, default: -1 },
			taskMissed:     { type: Number, default: -5 },
			dailyLogOnTime: { type: Number, default: 1 },
			dailyLogMissed: { type: Number, default: -2 },
			absentees: { type: Number, default: -5 },
			discipline: { type: Number, default: -10 },
		},
		// Role-based permission overrides (admin always has full access)
		rolePermissions: {
			department_head: { type: rolePermissionsSchema, default: () => ({}) },
			lead:            { type: rolePermissionsSchema, default: () => ({}) },
			employee:        { type: rolePermissionsSchema, default: () => ({}) },
		},
	},
	{
		timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
		versionKey: false,
	}
);

const Company = mongoose.model("Company", companySchema);

export default Company;
