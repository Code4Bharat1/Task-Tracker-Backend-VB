import {
	createTaskService,
	getTasksService,
	getTaskByIdService,
	updateTaskService,
	assignTaskService,
	deleteTaskService,
	advanceTaskStatusService,
	uploadTaskAttachmentService,
	deleteTaskAttachmentService,
} from "./task.service.js";

export const createTask = async (req, res, next) => {
	try {
		const { companyId, userId } = req;
		const task = await createTaskService({ companyId, userId, data: req.body });
		res.status(201).json({ task });
	} catch (err) {
		next(err);
	}
};

export const getTasks = async (req, res, next) => {
	try {
		const { companyId } = req;
		const { projectId, status, priority, assignedTo, page, limit } = req.query;
		const result = await getTasksService({
			companyId,
			projectId,
			status,
			priority,
			assignedTo,
			page,
			limit,
		});
		res.status(200).json(result);
	} catch (err) {
		next(err);
	}
};

export const getTaskById = async (req, res, next) => {
	try {
		const { companyId } = req;
		const task = await getTaskByIdService({ id: req.params.id, companyId });
		res.status(200).json({ task });
	} catch (err) {
		next(err);
	}
};

export const updateTask = async (req, res, next) => {
	try {
		const { companyId, userId } = req;
		const task = await updateTaskService({
			id: req.params.id,
			companyId,
			userId,
			data: req.body,
		});
		res.status(200).json({ task });
	} catch (err) {
		next(err);
	}
};

export const assignTask = async (req, res, next) => {
	try {
		const { companyId } = req;
		const task = await assignTaskService({
			id: req.params.id,
			companyId,
			data: req.body,
		});
		res.status(200).json({ task });
	} catch (err) {
		next(err);
	}
};

export const deleteTask = async (req, res, next) => {
	try {
		const { companyId } = req;
		await deleteTaskService({ id: req.params.id, companyId });
		res.status(200).json({ message: "Task deleted successfully" });
	} catch (err) {
		next(err);
	}
};

export const advanceTask = async (req, res, next) => {
	try {
		const { companyId } = req;
		const task = await advanceTaskStatusService({ id: req.params.id, companyId });
		res.status(200).json({ task });
	} catch (err) {
		next(err);
	}
};

export const uploadTaskAttachment = async (req, res, next) => {
	try {
		const { companyId } = req;
		const task = await uploadTaskAttachmentService({
			id: req.params.id,
			companyId,
			file: req.file,
		});
		res.status(200).json({ task });
	} catch (err) {
		next(err);
	}
};

export const deleteTaskAttachment = async (req, res, next) => {
	try {
		const { companyId } = req;
		const { publicId } = req.body;
		const task = await deleteTaskAttachmentService({
			id: req.params.id,
			companyId,
			publicId,
		});
		res.status(200).json({ task });
	} catch (err) {
		next(err);
	}
};
