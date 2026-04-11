import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
	{
		companyId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Company",
			required: true,
		},
		departmentId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Department",
		},
		name: {
			type: String,
			required: true,
			trim: true,
		},
		email: {
			type: String,
			required: true,
			trim: true,
			lowercase: true,
			unique: true,
		},
		passwordHash: {
			type: String,
			required: true,
			select: false,
		},
		googleSubId: {
			type: String,
			required: false,
			unique: true,
			sparse: true,
		},
		globalRole: {
			type: String,
			enum: ["admin", "department_head", "employee", "super_admin"],
			default: "employee",
			index: true,
		},
		isActive: {
			type: Boolean,
			default: true,
		},
		mustChangePassword: {
			type: Boolean,
			default: true,
		},
		behaviourScore: {
			type: Number,
			default: 0,
		},
		profilePic: {
			url: { type: String, default: null },
			publicId: { type: String, default: null },
		},
	},
	{
		timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
		versionKey: false,
	}
);
userSchema.index({ email: 1, companyId: 1 }, { unique: true });
userSchema.index({ companyId: 1, departmentId: 1 });
userSchema.index({ companyId: 1, globalRole: 1 });
const User = mongoose.model("User", userSchema);

export default User;
