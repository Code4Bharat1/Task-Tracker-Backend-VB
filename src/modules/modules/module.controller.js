import {
	createModuleService,
	getModulesService,
	getModuleByIdService,
	updateModuleService,
	deleteModuleService,
	advanceModuleStatusService,
} from "./module.service.js";

export const createModule = async (req, res, next) => {
	try {
		const { companyId, userId } = req;
		const module = await createModuleService({ companyId, userId, data: req.body });
		res.status(201).json({ module });
	} catch (err) {
		next(err);
	}
};

export const getModules = async (req, res, next) => {
	try {
		const { companyId } = req;
		const { projectId, status, assignedTo, page, limit } = req.query;
		const result = await getModulesService({ companyId, projectId, status, assignedTo, page, limit });
		res.status(200).json(result);
	} catch (err) {
		next(err);
	}
};

export const getModuleById = async (req, res, next) => {
	try {
		const { companyId } = req;
		const module = await getModuleByIdService({ id: req.params.id, companyId });
		res.status(200).json({ module });
	} catch (err) {
		next(err);
	}
};

export const updateModule = async (req, res, next) => {
	try {
		const { companyId, userId } = req;
		const module = await updateModuleService({
			id: req.params.id,
			companyId,
			userId,
			data: req.body,
		});
		res.status(200).json({ module });
	} catch (err) {
		next(err);
	}
};

export const deleteModule = async (req, res, next) => {
	try {
		const { companyId } = req;
		await deleteModuleService({ id: req.params.id, companyId });
		res.status(200).json({ message: "Module deleted successfully" });
	} catch (err) {
		next(err);
	}
};

export const advanceModule = async (req, res, next) => {
	try {
		const { companyId, userId } = req;
		const module = await advanceModuleStatusService({ id: req.params.id, companyId, userId });
		res.status(200).json({ module });
	} catch (err) {
		next(err);
	}
};
