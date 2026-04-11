import mongoose from "mongoose";
import Module from "./module.model.js";

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const ALLOWED_UPDATE_FIELDS = [
	"title",
	"description",
	"sequenceOrder",
	"status",
	"assignedTo",
	"assignedName",
	"completionNote",
	"testingType",
	"weightage",
	"deadline",
];

export const createModuleService = async ({ companyId, userId, data }) => {
	const {
		projectId,
		title,
		description,
		sequenceOrder,
		assignedTo,
		assignedName = "",
		deadline,
	} = data;
	if (!projectId) throw Object.assign(new Error("projectId is required"), { statusCode: 400 });
	if (!title) throw Object.assign(new Error("title is required"), { statusCode: 400 });

	// assignedTo may arrive as a single ID string or empty string
	const resolvedAssignedTo =
		assignedTo && mongoose.Types.ObjectId.isValid(assignedTo) ? assignedTo : null;

	return Module.create({
		companyId,
		projectId,
		title,
		description,
		sequenceOrder,
		assignedTo: resolvedAssignedTo,
		assignedName,
		deadline,
		created_by: userId,
	});
};

export const getModulesService = async ({ companyId, projectId, status, assignedTo, page = 1, limit = 20 }) => {
	page = Math.max(1, Number(page) || 1);
	limit = Math.min(100, Number(limit) || 20);
	const skip = (page - 1) * limit;

	const query = { companyId };
	if (projectId) query.projectId = projectId;
	if (status) query.status = status;
	if (assignedTo && isValidId(assignedTo)) query.assignedTo = assignedTo;

	const [data, total] = await Promise.all([
		Module.find(query)
			.select("-__v")
			.skip(skip)
			.limit(limit)
			.sort({ sequenceOrder: 1, created_at: -1 }),
		Module.countDocuments(query),
	]);

	return { data, pagination: { total, page, pages: Math.ceil(total / limit), limit } };
};

export const getModuleByIdService = async ({ id, companyId }) => {
	if (!isValidId(id)) throw Object.assign(new Error("Invalid module ID"), { statusCode: 400 });
	const module = await Module.findOne({ _id: id, companyId }).select("-__v");
	if (!module) throw Object.assign(new Error("Module not found"), { statusCode: 404 });
	return module;
};

export const updateModuleService = async ({ id, companyId, userId, data }) => {
	if (!isValidId(id)) throw Object.assign(new Error("Invalid module ID"), { statusCode: 400 });

	const updateData = {};
	for (const key of ALLOWED_UPDATE_FIELDS) {
		if (data[key] !== undefined) updateData[key] = data[key];
	}
	if (!Object.keys(updateData).length)
		throw Object.assign(new Error("No valid fields to update"), { statusCode: 400 });

	updateData.updated_by = userId;
	if (updateData.status === "COMPLETED") updateData.completedAt = new Date();

	const module = await Module.findOneAndUpdate({ _id: id, companyId }, updateData, {
		new: true,
		runValidators: true,
	});
	if (!module) throw Object.assign(new Error("Module not found"), { statusCode: 404 });
	return module;
};

export const deleteModuleService = async ({ id, companyId }) => {
	if (!isValidId(id)) throw Object.assign(new Error("Invalid module ID"), { statusCode: 400 });
	const module = await Module.findOneAndDelete({ _id: id, companyId });
	if (!module) throw Object.assign(new Error("Module not found"), { statusCode: 404 });
	return true;
};

const STATUS_SEQUENCE = [
	"TODO",
	"IN_PROGRESS",
	"DEV_COMPLETE",
	"CODE_REVIEW",
	"QA_TESTING",
	"APPROVED",
	"DEPLOYED",
];

export const advanceModuleStatusService = async ({ id, companyId, userId }) => {
	if (!isValidId(id)) throw Object.assign(new Error("Invalid module ID"), { statusCode: 400 });

	const module = await Module.findOne({ _id: id, companyId });
	if (!module) throw Object.assign(new Error("Module not found"), { statusCode: 404 });

	const currentIndex = STATUS_SEQUENCE.indexOf(module.status);
	if (currentIndex === -1 || currentIndex === STATUS_SEQUENCE.length - 1) {
		throw Object.assign(new Error("Module is already at the final status"), { statusCode: 400 });
	}

	module.status = STATUS_SEQUENCE[currentIndex + 1];
	module.updated_by = userId;
	await module.save();
	return module;
};
