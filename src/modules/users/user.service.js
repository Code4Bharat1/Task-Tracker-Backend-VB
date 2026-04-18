import generatePasswordAndHash from "../../utils/generatePasswordAndHash.js";
import { sendEmail } from "../../utils/sendEmail.js";
import User from "./user.model.js";
import { Readable } from "stream";
import cloudinary from "../../config/cloudinary.js";

export const createUserAccount = async (data) => {
	const { password, hashPassword } = await generatePasswordAndHash(data.name);
	// Ensure admin/super_admin users are not tied to a department
	const payload = { ...data };
	if (payload.globalRole === "admin" || payload.globalRole === "super_admin") {
		payload.departmentId = null;
	}
	const user = await User.create({
		...payload,
		passwordHash: hashPassword,
	});
	// Fire email without awaiting — don't block the response on SMTP
	sendEmail(
		data.email,
		"Temporary Password",
		`<p>Hi ${data.name},\n your temporary password is: ${password}. \n Please change your password after login.</p>`
	).catch((err) => console.error("[sendEmail] Failed to send welcome email:", err?.message));
	return user;
};

// Co-piloted 19:78
export const getUserAccounts = async ({
	companyId,
	departmentId,
	role: reqRole,
	page = 1,
	limit = 10,
	search = "",
	filterRole,
}) => {
	page = Math.max(1, Number(page) || 1);
	limit = Math.min(50, Number(limit) || 10);

	const skip = (page - 1) * limit;

	const query = {
		companyId,
	};

	if (reqRole === "department_head") {
		query.departmentId = departmentId;
		query.globalRole = { $in: ["employee", "lead", "contributor", "reviewer"] };
	}

	if (reqRole === "admin") {
		if (filterRole) query.globalRole = filterRole;
	}

	if (search) {
		query.$or = [
			{ name: { $regex: search, $options: "i" } },
			{ email: { $regex: search, $options: "i" } },
		];
	}

	// If a specific role was requested use it; otherwise exclude admin/super_admin
	const roleFilter = query.globalRole
		? { globalRole: query.globalRole }
		: { globalRole: { $nin: ["admin", "super_admin"] } };
	delete query.globalRole;

	const [users, total] = await Promise.all([
		User.find({
			...query,
			...roleFilter,
		})
			.select({
				passwordHash: 0,
				googleSubId: 0,
				mustChangePassword: 0,
			})
			.skip(skip)
			.limit(limit)
			.sort({ createdAt: -1 }),

		User.countDocuments(query),
	]);

	return {
		data: users,
		pagination: {
			total,
			page,
			pages: Math.ceil(total / limit),
			limit,
		},
	};
};

// Read-only: return all active users in the same company (safe for employees)
export const getColleaguesService = async ({ companyId }) => {
	const users = await User.find({ companyId, isActive: true })
		.select({ _id: 1, name: 1, email: 1, globalRole: 1, departmentId: 1 })
		.sort({ name: 1 });
	return { data: users };
};

export const getUserAccountById = async (id, companyId, departmentId) => {
	const query = { _id: id, companyId };
	if (departmentId) query.departmentId = departmentId;

	const user = await User.findOne(query).select({
		passwordHash: 0,
		googleSubId: 0,
		mustChangePassword: 0,
	});
	return user;
};

const ALLOWED_UPDATE_FIELDS = [
	"name",
	"email",
	"globalRole",
	"departmentId",
	"isActive",
	"behaviourScore",
];

export const updateUserAccount = async (id, companyId, departmentId, data) => {
	const query = { _id: id, companyId };
	if (departmentId) query.departmentId = departmentId;

	const updateData = {};
	for (const key of ALLOWED_UPDATE_FIELDS) {
		if (data[key] !== undefined) updateData[key] = data[key];
	}

	// Coerce empty string departmentId to null so Mongoose doesn't try to cast "" as ObjectId
	if (updateData.departmentId === "" || updateData.departmentId === null) {
		updateData.departmentId = null;
	}

	// If the user is being set to admin/super_admin, remove any department association
	if (updateData.globalRole === "admin" || updateData.globalRole === "super_admin") {
		updateData.departmentId = null;
	}

	if (!Object.keys(updateData).length) {
		const err = new Error("No valid fields to update");
		err.statusCode = 400;
		throw err;
	}

	return User.findOneAndUpdate(query, updateData, { new: true, runValidators: true }).select({
		passwordHash: 0,
		googleSubId: 0,
		mustChangePassword: 0,
	});
};

export const deleteUserAccount = async (id, companyId, departmentId) => {
	const query = { _id: id, companyId };
	if (departmentId) query.departmentId = departmentId;

	const user = await User.findOneAndDelete(query);
	return !!user;
};

// route to get all users from DB
// Co-piloted 104:124
export const getAllUsersAccounts = async (page = 1, max = 10) => {
	page = Math.max(1, Number(page) || 1);
	max = Math.min(50, Number(max) || 10);
	const skip = (page - 1) * max;
	const users = await User.find()
		.select({
			passwordHash: 0,
			googleSubId: 0,
			mustChangePassword: 0,
		})
		.skip(skip)
		.limit(max);
	const total = await User.countDocuments();
	return {
		data: users,
		pagination: {
			total,
			page,
			pages: Math.ceil(total / max),
			limit: max,
		},
	};
};

// ─── Profile pic helpers ──────────────────────────────────────────────────────

function uploadImageToCloudinary(buffer, folder) {
	return new Promise((resolve, reject) => {
		const stream = cloudinary.uploader.upload_stream(
			{ folder, resource_type: "image", overwrite: true },
			(error, result) => {
				if (error) return reject(error);
				resolve(result);
			}
		);
		Readable.from(buffer).pipe(stream);
	});
}

async function deleteImageFromCloudinary(publicId) {
	try {
		await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
	} catch {
		// non-fatal
	}
}

// ─── Profile pic service functions ───────────────────────────────────────────
// Profile pic service functions
export const uploadProfilePicService = async ({ userId, companyId, file }) => {
	const user = await User.findOne({ _id: userId, companyId });
	if (!user) throw Object.assign(new Error("User not found"), { statusCode: 404 });

	// Delete old pic if exists
	if (user.profilePic?.publicId) {
		await deleteImageFromCloudinary(user.profilePic.publicId);
	}

	const result = await uploadImageToCloudinary(file.buffer, `profile-pics/${companyId}`);

	return User.findByIdAndUpdate(
		userId,
		{ profilePic: { url: result.secure_url, publicId: result.public_id } },
		{ new: true }
	).select({ passwordHash: 0, googleSubId: 0, mustChangePassword: 0 });
};

export const getProfilePicService = async ({ userId, companyId }) => {
	const user = await User.findOne({ _id: userId, companyId }).select("profilePic");
	if (!user) throw Object.assign(new Error("User not found"), { statusCode: 404 });
	return user.profilePic;
};

export const deleteProfilePicService = async ({ userId, companyId }) => {
	const user = await User.findOne({ _id: userId, companyId });
	if (!user) throw Object.assign(new Error("User not found"), { statusCode: 404 });

	if (!user.profilePic?.publicId) {
		throw Object.assign(new Error("No profile picture to delete"), { statusCode: 404 });
	}

	await deleteImageFromCloudinary(user.profilePic.publicId);

	return User.findByIdAndUpdate(
		userId,
		{ profilePic: { url: null, publicId: null } },
		{ new: true }
	).select({ passwordHash: 0, googleSubId: 0, mustChangePassword: 0 });
};
