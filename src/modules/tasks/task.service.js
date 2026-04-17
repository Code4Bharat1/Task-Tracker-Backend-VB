import mongoose from "mongoose";
import Task from "./task.model.js";
import Company from "../companies/companies.model.js";
import { scoreTaskCompletion } from "../scoring/scoring.service.js";
import cloudinary from "../../config/cloudinary.js";
import { Readable } from "stream";

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const ALLOWED_UPDATE_FIELDS = [
	"title",
	"description",
	"priority",
	"status",
	"completionNote",
	"deadline",
	"startTime",
	"endTime",
	"developerStartedAt",
	"developerFinishedAt",
	"testerStartedAt",
	"testerFinishedAt",
];

// Create a task (Lead only)
export const createTaskService = async ({ companyId, userId, data }) => {
	const {
		projectId,
		title,
		description,
		priority,
		deadline,
		startTime,
		endTime,
		contributors = [],
		reviewers = [],
	} = data;

	if (!projectId) throw Object.assign(new Error("projectId is required"), { statusCode: 400 });
	if (!title) throw Object.assign(new Error("title is required"), { statusCode: 400 });

	const contributorEntries = contributors
		.filter((id) => isValidId(id))
		.map((id) => ({ userId: id }));

	const reviewerEntries = reviewers.filter((id) => isValidId(id)).map((id) => ({ userId: id }));

	// If no deadline provided, use company default
	let taskDeadline = deadline;
	if (!taskDeadline) {
		try {
			const company = await Company.findById(companyId);
			if (company?.defaultTaskDeadline) {
				const [hh, mm] = company.defaultTaskDeadline.split(":").map(Number);
				const now = new Date();
				const todayDeadline = new Date(now);
				todayDeadline.setHours(hh, mm, 0, 0);
				// If today's deadline has passed, set for tomorrow
				if (todayDeadline <= now) {
					todayDeadline.setDate(todayDeadline.getDate() + 1);
				}
				taskDeadline = todayDeadline;
			}
		} catch {
			// silently skip default deadline
		}
	}

	return Task.create({
		companyId,
		projectId,
		title,
		description,
		priority,
		deadline: taskDeadline,
		startTime: startTime || null,
		endTime: endTime || null,
		contributors: contributorEntries,
		reviewers: reviewerEntries,
		created_by: userId,
	});
};

// Get tasks with optional filters
export const getTasksService = async ({
	companyId,
	departmentId,
	role,
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
	if (projectId) {
		query.projectId = projectId;
	} else if (role === "department_head" && departmentId) {
		// Scope to projects in this department only
		const Project = (await import("../projects/projects.model.js")).default;
		const deptProjects = await Project.find({ companyId, departmentId }).select("_id").lean();
		query.projectId = { $in: deptProjects.map((p) => p._id) };
	}
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

	// Score on completion
	if (task.status === "DONE" && !task.scoreApplied) {
		try {
			await scoreTaskCompletion(task);
		} catch {
			/* non-blocking */
		}
	}

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

const STATUS_SEQUENCE = ["TODO", "IN_PROGRESS", "DONE"];

// Advance task to the next status in the sequence
export const advanceTaskStatusService = async ({ id, companyId }) => {
	if (!isValidId(id)) throw Object.assign(new Error("Invalid task ID"), { statusCode: 400 });

	const task = await Task.findOne({ _id: id, companyId });
	if (!task) throw Object.assign(new Error("Task not found"), { statusCode: 404 });

	const currentIndex = STATUS_SEQUENCE.indexOf(task.status);
	if (currentIndex === -1 || currentIndex === STATUS_SEQUENCE.length - 1) {
		throw Object.assign(new Error("Task is already at the final status"), { statusCode: 400 });
	}

	const nextStatus = STATUS_SEQUENCE[currentIndex + 1];

	if (nextStatus === "IN_PROGRESS") {
		task.developerStartedAt = new Date();
	} else if (nextStatus === "DONE") {
		task.developerFinishedAt = new Date();
		task.testerFinishedAt = new Date(); // Log both as finished at the same time if no review step
		task.completedAt = new Date();
	}

	task.status = nextStatus;
	await task.save();

	// Score on completion
	if (task.status === "DONE" && !task.scoreApplied) {
		try {
			await scoreTaskCompletion(task);
		} catch {
			/* non-blocking */
		}
	}

	return task;
};

// Start tester review timing
export const startTesterReviewService = async ({ id, companyId }) => {
	if (!isValidId(id)) throw Object.assign(new Error("Invalid task ID"), { statusCode: 400 });

	const task = await Task.findOne({ _id: id, companyId });
	if (!task) throw Object.assign(new Error("Task not found"), { statusCode: 404 });

	if (task.status !== "IN_REVIEW") {
		throw Object.assign(new Error("Task must be in IN_REVIEW status to start review"), {
			statusCode: 400,
		});
	}

	if (!task.testerStartedAt) {
		task.testerStartedAt = new Date();
		await task.save();
	}

	return task;
};

// Upload an attachment to a task
export const uploadTaskAttachmentService = async ({ id, companyId, file }) => {
	if (!isValidId(id)) throw Object.assign(new Error("Invalid task ID"), { statusCode: 400 });
	if (!file) throw Object.assign(new Error("No file provided"), { statusCode: 400 });

	const task = await Task.findOne({ _id: id, companyId });
	if (!task) throw Object.assign(new Error("Task not found"), { statusCode: 404 });

	if ((task.attachments || []).length >= 5) {
		throw Object.assign(new Error("Maximum 5 attachments per task"), { statusCode: 400 });
	}

	const result = await new Promise((resolve, reject) => {
		const stream = cloudinary.uploader.upload_stream(
			{
				folder: `tasks/${companyId}/${id}`,
				resource_type: "auto",
			},
			(err, result) => (err ? reject(err) : resolve(result))
		);
		Readable.from(file.buffer).pipe(stream);
	});

	task.attachments.push({
		url: result.secure_url,
		publicId: result.public_id,
		fileName: file.originalname,
		fileType: file.mimetype,
	});

	await task.save();
	return task;
};

// Delete an attachment from a task
export const deleteTaskAttachmentService = async ({ id, companyId, publicId }) => {
	if (!isValidId(id)) throw Object.assign(new Error("Invalid task ID"), { statusCode: 400 });

	const task = await Task.findOne({ _id: id, companyId });
	if (!task) throw Object.assign(new Error("Task not found"), { statusCode: 404 });

	const idx = task.attachments.findIndex((a) => a.publicId === publicId);
	if (idx === -1) throw Object.assign(new Error("Attachment not found"), { statusCode: 404 });

	await cloudinary.uploader.destroy(publicId);
	task.attachments.splice(idx, 1);
	await task.save();
	return task;
};
