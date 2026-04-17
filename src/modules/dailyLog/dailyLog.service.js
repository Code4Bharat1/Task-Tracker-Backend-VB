import mongoose from "mongoose";
import { Readable } from "stream";
import DailyLog from "./dailyLog.model.js";
import Task from "../tasks/task.model.js";
import cloudinary from "../../config/cloudinary.js";

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// Validate each entry in the array
async function validateEntries(entries, companyId) {
	if (!Array.isArray(entries) || entries.length === 0)
		throw Object.assign(new Error("entries must be a non-empty array"), { statusCode: 400 });

	for (const [i, e] of entries.entries()) {
		if (!e.projectId)
			throw Object.assign(new Error(`entries[${i}]: projectId is required`), { statusCode: 400 });
		if (!e.description?.trim())
			throw Object.assign(new Error(`entries[${i}]: description is required`), { statusCode: 400 });

		if (e.taskId && isValidId(e.taskId)) {
			const task = await Task.findOne({ _id: e.taskId, companyId }).select("status");
			if (!task)
				throw Object.assign(new Error(`entries[${i}]: Task not found`), { statusCode: 404 });
			if (task.status !== "IN_PROGRESS")
				throw Object.assign(
					new Error(`entries[${i}]: Task must be IN_PROGRESS (currently ${task.status})`),
					{ statusCode: 400 }
				);
		}
	}
}

// POST /daily-logs  — create or replace the log for a given day
export const createDailyLogService = async ({ companyId, userId, data }) => {
	const { logDate, entries } = data;
	if (!logDate) throw Object.assign(new Error("logDate is required"), { statusCode: 400 });
	await validateEntries(entries, companyId);

	// Normalise date to midnight UTC so the unique index works correctly
	const date = new Date(logDate);
	date.setUTCHours(0, 0, 0, 0);

	// Upsert: one document per user per day
	return DailyLog.findOneAndUpdate(
		{ companyId, userId, logDate: date },
		{ $set: { entries } },
		{ upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
	);
};

// GET /daily-logs
export const getDailyLogsService = async ({
	companyId,
	userId: filterUserId,
	projectId,
	role,
	requesterId,
	page = 1,
	limit = 20,
}) => {
	page = Math.max(1, Number(page) || 1);
	limit = Math.min(100, Number(limit) || 20);
	const skip = (page - 1) * limit;

	const query = { companyId };
	if (role === "employee") query.userId = requesterId;
	else if (filterUserId) query.userId = filterUserId;

	// Filter by projectId inside entries array
	if (projectId) query["entries.projectId"] = new mongoose.Types.ObjectId(projectId);

	const [rawData, total] = await Promise.all([
		DailyLog.find(query)
			.select("-__v")
			.skip(skip)
			.limit(limit)
			.sort({ logDate: -1 })
			.populate("userId", "name")
			.populate("entries.projectId", "name")
			.populate("entries.taskId", "title"),
		DailyLog.countDocuments(query),
	]);

	const data = rawData.map((log) => {
		const obj = log.toObject();
		obj.userName = obj.userId?.name || "";
		obj.userId = obj.userId?._id ?? obj.userId;
		obj.entries = (obj.entries || []).map((e) => ({
			...e,
			projectName: e.projectId?.name || "",
			taskTitle: e.taskId?.title || "",
			projectId: e.projectId?._id ?? e.projectId,
			taskId: e.taskId?._id ?? e.taskId,
		}));
		return obj;
	});

	return { data, pagination: { total, page, pages: Math.ceil(total / limit), limit } };
};

// GET /daily-logs/:id
export const getDailyLogByIdService = async ({ id, companyId, role, requesterId }) => {
	if (!isValidId(id)) throw Object.assign(new Error("Invalid log ID"), { statusCode: 400 });
	const log = await DailyLog.findOne({ _id: id, companyId })
		.populate("userId", "name")
		.populate("entries.projectId", "name")
		.populate("entries.taskId", "title");
	if (!log) throw Object.assign(new Error("Daily log not found"), { statusCode: 404 });
	if (role === "employee" && log.userId._id.toString() !== requesterId)
		throw Object.assign(new Error("Unauthorized"), { statusCode: 403 });
	return log;
};

// PATCH /daily-logs/:id  — replace the entries array
export const updateDailyLogService = async ({ id, companyId, role, requesterId, data }) => {
	if (!isValidId(id)) throw Object.assign(new Error("Invalid log ID"), { statusCode: 400 });

	const log = await DailyLog.findOne({ _id: id, companyId });
	if (!log) throw Object.assign(new Error("Daily log not found"), { statusCode: 404 });
	if (role === "employee" && log.userId.toString() !== requesterId)
		throw Object.assign(new Error("Unauthorized"), { statusCode: 403 });

	const update = {};
	if (data.logDate) update.logDate = data.logDate;
	if (data.entries) {
		await validateEntries(data.entries, companyId);
		update.entries = data.entries;
	}

	if (!Object.keys(update).length)
		throw Object.assign(new Error("No valid fields to update"), { statusCode: 400 });

	return DailyLog.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true });
};

// DELETE /daily-logs/:id
export const deleteDailyLogService = async ({ id, companyId, role, requesterId }) => {
	if (!isValidId(id)) throw Object.assign(new Error("Invalid log ID"), { statusCode: 400 });
	const log = await DailyLog.findOne({ _id: id, companyId });
	if (!log) throw Object.assign(new Error("Daily log not found"), { statusCode: 404 });
	if (role === "employee" && log.userId.toString() !== requesterId)
		throw Object.assign(new Error("Unauthorized"), { statusCode: 403 });
	await log.deleteOne();
	return true;
};

// POST /daily-logs/:id/entries/:entryId/screenshot — upload screenshot for a log entry
export const uploadEntryScreenshotService = async ({ id, entryId, companyId, role, requesterId, file }) => {
	if (!isValidId(id)) throw Object.assign(new Error("Invalid log ID"), { statusCode: 400 });
	if (!file) throw Object.assign(new Error("No file provided"), { statusCode: 400 });

	const log = await DailyLog.findOne({ _id: id, companyId });
	if (!log) throw Object.assign(new Error("Daily log not found"), { statusCode: 404 });
	if (role === "employee" && log.userId.toString() !== requesterId)
		throw Object.assign(new Error("Unauthorized"), { statusCode: 403 });

	const entry = log.entries.id(entryId);
	if (!entry) throw Object.assign(new Error("Entry not found"), { statusCode: 404 });

	const result = await new Promise((resolve, reject) => {
		const stream = cloudinary.uploader.upload_stream(
			{ folder: `daily-logs/${companyId}/${id}`, resource_type: "image" },
			(err, res) => (err ? reject(err) : resolve(res))
		);
		Readable.from(file.buffer).pipe(stream);
	});

	entry.screenshotUrl = result.secure_url;
	await log.save();
	return log;
};
