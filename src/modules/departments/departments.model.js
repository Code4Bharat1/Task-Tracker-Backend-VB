import mongoose, { Schema } from "mongoose";

const departmentSchema = new Schema(
	{
		companyId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Company",
			required: true,
			index: true,
		},
		departmentName: {
			type: String,
			required: true,
			trim: true,
			lowercase: true,
		},
	},
	{
		timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
		versionKey: false,
	},
);

departmentSchema.index({ companyId: 1, departmentName: 1 }, { unique: true });
const Department = mongoose.model("Department", departmentSchema);

export default Department;
