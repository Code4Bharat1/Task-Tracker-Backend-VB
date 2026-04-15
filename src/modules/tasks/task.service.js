import mongoose from "mongoose";
import Task from "./task.model.js";

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const ALLOWED_UPDATE_FIELDS = [
	"title",
	"description",
	"priority",
	"status",
	"completionNote",
	"deadline",
];

// Create a task (Lead only)
export const createTaskService = async ({ companyId, userId, data }) => {
	const {
		projectId,
		title,
		description,
		priority,
		deadline,
		contributors = [],
		reviewers = [],
	} = data;

	if (!projectId) throw Object.assign(new Error("projectId is required"), { statusCode: 400 });
	if (!title) throw Object.assign(new Error("title is required"), { statusCode: 400 });

	const contributorEntries = contributors
		.filter((id) => isValidId(id))
		.map((id) => ({ userId: id }));

	const reviewerEntries = reviewers.filter((id) => isValidId(id)).map((id) => ({ userId: id }));

	return Task.create({
		companyId,
		projectId,
		title,
		description,
		priority,
		deadline,
		contributors: contributorEntries,
		reviewers: reviewerEntries,
		created_by: userId,
	});
};

// Get tasks with optional filters
export const getTasksService = async ({
	companyId,
	projectId,
	status,
	priority,
	assignedTo,
	page = 1,
	limit = 20,
}) => {
	page = Math.max(1, Number(page) || 1);
	limit = Math.min(100, Number(limit) || 20);
	const skip = (page - 1) * limit;

	const query = { companyId };
	if (projectId) query.projectId = projectId;
	if (status) query.status = status;
	if (priority) query.priority = priority;
	if (assignedTo && isValidId(assignedTo)) {
		query.$or = [{ "contributors.userId": assignedTo }, { "reviewers.userId": assignedTo }];
	}

	const [data, total] = await Promise.all([
		Task.find(query)
			.select("-__v")
			.skip(skip)
			.limit(limit)
			.sort({ created_at: -1 })
			.populate("contributors.userId", "name email")
			.populate("reviewers.userId", "name email")
			.populate("created_by", "name"),
		Task.countDocuments(query),
	]);

	return { data, pagination: { total, page, pages: Math.ceil(total / limit), limit } };
};

// Get single task by ID
export const getTaskByIdService = async ({ id, companyId }) => {
	if (!isValidId(id)) throw Object.assign(new Error("Invalid task ID"), { statusCode: 400 });
	const task = await Task.findOne({ _id: id, companyId })
		.select("-__v")
		.populate("contributors.userId", "name email")
		.populate("reviewers.userId", "name email")
		.populate("created_by", "name");
	if (!task) throw Object.assign(new Error("Task not found"), { statusCode: 404 });
	return task;
};

// Update task fields
export const updateTaskService = async ({ id, companyId, userId, data }) => {
	if (!isValidId(id)) throw Object.assign(new Error("Invalid task ID"), { statusCode: 400 });

	const updateData = {};
	for (const key of ALLOWED_UPDATE_FIELDS) {
		if (data[key] !== undefined) updateData[key] = data[key];
	}
	if (!Object.keys(updateData).length)
		throw Object.assign(new Error("No valid fields to update"), { statusCode: 400 });

	if (updateData.status === "DONE") updateData.completedAt = new Date();

	const task = await Task.findOneAndUpdate({ _id: id, companyId }, updateData, {
		new: true,
		runValidators: true,
	});
	if (!task) throw Object.assign(new Error("Task not found"), { statusCode: 404 });
	return task;
};

// Assign contributors and/or reviewers to a task (Lead only)
export const assignTaskService = async ({ id, companyId, data }) => {
	if (!isValidId(id)) throw Object.assign(new Error("Invalid task ID"), { statusCode: 400 });

	const { contributors, reviewers } = data;

	if (!contributors && !reviewers)
		throw Object.assign(new Error("contributors or reviewers required"), { statusCode: 400 });

	const updateData = {};

	if (contributors !== undefined) {
		const entries = contributors.filter((uid) => isValidId(uid)).map((uid) => ({ userId: uid }));
		updateData.contributors = entries;
	}

	if (reviewers !== undefined) {
		const entries = reviewers.filter((uid) => isValidId(uid)).map((uid) => ({ userId: uid }));
		updateData.reviewers = entries;
	}

	const task = await Task.findOneAndUpdate({ _id: id, companyId }, updateData, {
		new: true,
		runValidators: true,
	});
	if (!task) throw Object.assign(new Error("Task not found"), { statusCode: 404 });
	return task;
};

// Delete a task
export const deleteTaskService = async ({ id, companyId }) => {
	if (!isValidId(id)) throw Object.assign(new Error("Invalid task ID"), { statusCode: 400 });
	const task = await Task.findOneAndDelete({ _id: id, companyId });
	if (!task) throw Object.assign(new Error("Task not found"), { statusCode: 404 });
	return true;
};

const STATUS_SEQUENCE = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];

// Advance task to the next status in the sequence
export const advanceTaskStatusService = async ({ id, companyId }) => {
	if (!isValidId(id)) throw Object.assign(new Error("Invalid task ID"), { statusCode: 400 });

	const task = await Task.findOne({ _id: id, companyId });
	if (!task) throw Object.assign(new Error("Task not found"), { statusCode: 404 });

	const currentIndex = STATUS_SEQUENCE.indexOf(task.status);
	if (currentIndex === -1 || currentIndex === STATUS_SEQUENCE.length - 1) {
		throw Object.assign(new Error("Task is already at the final status"), { statusCode: 400 });
	}

	task.status = STATUS_SEQUENCE[currentIndex + 1];
	if (task.status === "DONE") task.completedAt = new Date();
	await task.save();
	return task;
};
