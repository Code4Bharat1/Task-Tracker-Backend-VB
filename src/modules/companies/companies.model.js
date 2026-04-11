import mongoose, { Schema } from "mongoose";

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
		shiftStart: {
			type: String, // "HH:MM" 24h format
			default: "09:00",
		},
		shiftEnd: {
			type: String,
			default: "18:00",
		},
		logDeadlines: {
			type: [String], // ["HH:MM"] 24h format
			default: ["22:00"],
		},
	},
	{
		timestamps: {
			createdAt: "created_at",
			updatedAt: "updated_at",
		},
		versionKey: false,
	}
);

const Company = mongoose.model("Company", companySchema);

export default Company;
