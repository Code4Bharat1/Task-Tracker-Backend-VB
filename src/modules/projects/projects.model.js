import mongoose from "mongoose";

const testingPhaseSchema = new mongoose.Schema(
	{
		name: { type: String, required: true },
		weight: { type: Number, default: 25 },
		status: {
			type: String,
			enum: ["PENDING", "PASSED", "FAILED"],
			default: "PENDING",
		},
		completedAt: { type: Date, default: null },
		completedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
	},
	{ _id: false }
);

const DEFAULT_PHASES = [
	{ name: "Frontend Testing", weight: 25 },
	{ name: "Backend Testing", weight: 25 },
	{ name: "Cybersecurity Testing", weight: 25 },
	{ name: "SEO / Performance", weight: 25 },
];

const projectSchema = new mongoose.Schema(
	{
		companyId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Company",
			required: true,
			index: true,
		},
		departmentId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Department",
			required: true,
			index: true,
		},
		name: {
			type: String,
			required: true,
			trim: true,
		},
		description: {
			type: String,
			default: "",
		},
		status: {
			type: String,
			enum: ["PLANNING", "IN_PROGRESS", "CODE_REVIEW", "QA_TESTING", "APPROVED", "DEPLOYED"],
			default: "PLANNING",
			index: true,
		},
		// Team members
		managerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
		testerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
		developerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
		startDate: {
			type: Date,
			default: null,
		},
		endDate: {
			type: Date,
			default: null,
		},
		created_by: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
		},
		completedAt: {
			type: Date,
			default: null,
		},
		testingPhases: {
			type: [testingPhaseSchema],
			default: () => DEFAULT_PHASES.map((p) => ({ ...p })),
		},
		srsDocument: {
			url: { type: String, default: null },
			publicId: { type: String, default: null },
		},
	},
	{
		timestamps: { createdAt: true, updatedAt: true },
	}
);

projectSchema.index({ companyId: 1, departmentId: 1, status: 1 });

export default mongoose.model("Project", projectSchema);
