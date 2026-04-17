import {
	createProjectService,
	getProjectsService,
	getProjectByIdService,
	getMyProjectsService,
	assignProjectTeamService,
	updateProjectService,
	updateTestingPhaseService,
	deleteProjectService,
	uploadSrsService,
	getSrsService,
	deleteSrsService,
} from "./projects.service.js";
import customError from "../../utils/error.js";

// CREATE
export const createProject = async (req, res, next) => {
	try {
		const { companyId, departmentId, userId } = req;

		const project = await createProjectService({
			companyId,
			departmentId,
			userId,
			data: req.body,
		});

		res.status(201).json({ project });
	} catch (err) {
		next(err);
	}
};

// GET ALL
export const getProjects = async (req, res, next) => {
	try {
		const { companyId, departmentId, role } = req;
		const { status, page, limit } = req.query;

		const result = await getProjectsService({
			companyId,
			departmentId,
			role,
			status,
			page,
			limit,
		});

		res.status(200).json(result);
	} catch (err) {
		next(err);
	}
};

// GET BY ID
export const getProjectById = async (req, res, next) => {
	try {
		const { companyId, departmentId, role } = req;
		const { id } = req.params;

		const project = await getProjectByIdService({
			id,
			companyId,
			departmentId,
			role,
		});

		res.status(200).json({ project });
	} catch (err) {
		next(err);
	}
};

// UPDATE
export const updateProject = async (req, res, next) => {
	try {
		const { companyId, departmentId, role, userId } = req;
		const { id } = req.params;

		const project = await updateProjectService({
			id,
			companyId,
			departmentId,
			role,
			userId,
			data: req.body,
		});

		res.status(200).json({ project });
	} catch (err) {
		next(err);
	}
};

// DELETE
export const deleteProject = async (req, res, next) => {
	try {
		const { companyId, departmentId, role } = req;
		const { id } = req.params;

		await deleteProjectService({
			id,
			companyId,
			departmentId,
			role,
		});

		res.status(200).json({ message: "Project deleted successfully" });
	} catch (err) {
		next(err);
	}
};

// GET MY PROJECTS
export const getMyProjects = async (req, res, next) => {
	try {
		const { companyId, userId } = req;

		const result = await getMyProjectsService({ companyId, userId });

		res.status(200).json(result);
	} catch (err) {
		next(err);
	}
};

// ASSIGN PROJECT TEAM
export const assignProjectTeam = async (req, res, next) => {
	try {
		const { companyId, departmentId, role, userId } = req;
		const { id } = req.params;

		const project = await assignProjectTeamService({
			id,
			companyId,
			departmentId,
			role,
			userId,
			data: req.body,
		});

		res.status(200).json({ project });
	} catch (err) {
		next(err);
	}
};

// UPDATE TESTING PHASE
export const updateTestingPhase = async (req, res, next) => {
	try {
		const { companyId, userId } = req;
		const { id } = req.params;

		const project = await updateTestingPhaseService({
			id,
			companyId,
			userId,
			data: req.body,
		});

		res.status(200).json({ project });
	} catch (err) {
		next(err);
	}
};

// ─── SRS handlers ─────────────────────────────────────────────────────────────

export const uploadSrs = async (req, res, next) => {
	try {
		if (!req.file) return next(customError("SRS file is required", 400));
		const { companyId } = req;
		const { id } = req.params;
		const project = await uploadSrsService({ id, companyId, file: req.file });
		res.status(200).json({ project });
	} catch (err) {
		next(err);
	}
};

export const getSrs = async (req, res, next) => {
	try {
		const { companyId } = req;
		const { id } = req.params;
		const srsDocument = await getSrsService({ id, companyId });
		res.status(200).json({ srsDocument });
	} catch (err) {
		next(err);
	}
};

export const deleteSrs = async (req, res, next) => {
	try {
		const { companyId } = req;
		const { id } = req.params;
		const project = await deleteSrsService({ id, companyId });
		res.status(200).json({ project });
	} catch (err) {
		next(err);
	}
};
