import mongoose from "mongoose";

const ReportSchema = new mongoose.Schema(
	{
		types: [String],
		projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: false },
		date: { type: Date, required: false },
		notes: { type: String, required: false },
		clientResponse: { type: String, required: false, default: "" },
		weeklyIncluded: { type: Boolean, default: false },
		monthlyIncluded: { type: Boolean, default: false },
		createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
	},
	{ timestamps: true }
);

export default mongoose.model("Report", ReportSchema);
