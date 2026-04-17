import Project from "./projects.model.js";
import mongoose from "mongoose";
import Task from "../tasks/task.model.js";
import { Readable } from "stream";
import cloudinary from "../../config/cloudinary.js";

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// allowed update fields
const ALLOWED_UPDATE_FIELDS = [
	"name",
	"description",
	"status",
	"managerIds",
	"testerIds",
	"developerIds",
	"startDate",
	"endDate",
];

export const createProjectService = async ({ companyId, departmentId, userId, data }) => {
	const {
		name,
		description,
		status = "PLANNING",
		managerIds = [],
		testerIds = [],
		developerIds = [],
		startDate,
		endDate,
	} = data;

	if (!name) throw new Error("Project name is required");

	return await Project.create({
		name,
		description,
		status,
		managerIds: [...new Set(managerIds)],
		testerIds: [...new Set(testerIds)],
		developerIds: [...new Set(developerIds)],
		startDate,
		endDate,
		companyId,
		departmentId,
		created_by: userId,
	});
};

// get all projects
export const getProjectsService = async ({
	companyId,
	departmentId,
	role,
	status,
	page = 1,
	limit = 10,
}) => {
	page = Math.max(1, Number(page) || 1);
	limit = Math.min(50, Number(limit) || 10);
	const skip = (page - 1) * limit;

	const query = { companyId };

	// RBAC
	if (role === "department_head") {
		query.departmentId = departmentId;
	}

	if (status) query.status = status;

	// Populate related refs so frontend can display friendly names
	const [projectsRaw, total] = await Promise.all([
		Project.find(query)
			.select("-__v")
			.populate({ path: "departmentId", select: "departmentName" })
			.populate({ path: "managerIds", select: "name" })
			.populate({ path: "testerIds", select: "name" })
			.populate({ path: "developerIds", select: "name" })
			.skip(skip)
			.limit(limit)
			.sort({ createdAt: -1 }),

		Project.countDocuments(query),
	]);

	const projects = (projectsRaw || []).map((p) => {
		const obj = p.toObject ? p.toObject() : p;
		const managerNames = (obj.managerIds || []).map((m) => (m && m.name ? m.name : String(m)));
		const developerNames = (obj.developerIds || []).map((d) => (d && d.name ? d.name : String(d)));
		const testerNames = (obj.testerIds || []).map((t) => (t && t.name ? t.name : String(t)));
		const departmentName = obj.departmentId?.departmentName ?? obj.departmentId ?? null;

		return {
			...obj,
			managerNames,
			developerNames,
			testerNames,
			departmentName,
		};
	});

	// Aggregate task counts for the returned projects
	try {
		const projectIds = projects.map((p) => p._id).filter(Boolean);
		if (projectIds.length > 0) {
			const agg = await Task.aggregate([
				{ $match: { projectId: { $in: projectIds } } },
				{
					$group: {
						_id: "$projectId",
						total: { $sum: 1 },
						completed: {
							$sum: {
								$cond: [{ $eq: ["$status", "DONE"] }, 1, 0],
							},
						},
					},
				},
			]);

			const map = Object.fromEntries(agg.map((a) => [String(a._id), a]));
			projects.forEach((p) => {
				const t = map[String(p._id)];
				p.tasksTotal = t?.total ?? 0;
				p.tasksCompleted = t?.completed ?? 0;
			});
		}
	} catch (e) {
		// If aggregation fails, fall back to zeroed task counts
		projects.forEach((p) => {
			p.tasksTotal = p.tasksTotal ?? 0;
			p.tasksCompleted = p.tasksCompleted ?? 0;
		});
	}

	return {
		data: projects,
		pagination: {
			total,
			page,
			pages: Math.ceil(total / limit),
			limit,
		},
	};
};

// get by id
export const getProjectByIdService = async ({ id, companyId, departmentId, role }) => {
	if (!isValidId(id)) throw new Error("Invalid project ID");

	const query = { _id: id, companyId };

	if (role === "department_head") {
		query.departmentId = departmentId;
	}

	const project = await Project.findOne(query).select("-__v");

	if (!project) throw new Error("Project not found");

	return project;
};

// get projects assigned to a specific user (as manager, tester, or developer)
export const getMyProjectsService = async ({ companyId, userId }) => {
	if (!isValidId(userId)) throw new Error("Invalid user ID");

	const query = {
		companyId,
		$or: [{ managerIds: userId }, { testerIds: userId }, { developerIds: userId }],
	};

	const projects = await Project.find(query).select("-__v").sort({ createdAt: -1 });

	return {
		data: projects,
	};
};

// assign or update project team members (managerIds/testerIds/developerIds)
export const assignProjectTeamService = async ({
	id,
	companyId,
	departmentId,
	role,
	userId,
	data,
}) => {
	if (!isValidId(id)) throw new Error("Invalid project ID");

	const { managerIds, testerIds, developerIds } = data || {};

	if (!managerIds && !testerIds && !developerIds) {
		throw new Error("No team data provided");
	}

	const project = await Project.findOne({ _id: id, companyId }).select("managerIds departmentId");

	if (!project) throw new Error("Project not found");

	// RBAC: department_head may manage teams for projects in their department
	// project_manager may manage teams only for projects they are listed as a manager
	if (role === "department_head") {
		if (String(project.departmentId) !== String(departmentId)) {
			throw new Error("Not authorized to modify this project");
		}
	} else if (role === "project_manager") {
		const mgrs = (project.managerIds || []).map((m) => String(m));
		if (!mgrs.includes(String(userId))) {
			throw new Error("Not authorized to modify this project team");
		}
	} else {
		throw new Error("Not authorized to modify project team");
	}

	const updateData = {};
	if (managerIds !== undefined) updateData.managerIds = [...new Set(managerIds)];
	if (testerIds !== undefined) updateData.testerIds = [...new Set(testerIds)];
	if (developerIds !== undefined) updateData.developerIds = [...new Set(developerIds)];

	updateData.updated_by = userId;

	const updated = await Project.findOneAndUpdate({ _id: id, companyId }, updateData, {
		new: true,
		runValidators: true,
	}).select("-__v");

	if (!updated) throw new Error("Failed to update project team");

	return updated;
};

// update
export const updateProjectService = async ({ id, companyId, departmentId, role, data, userId }) => {
	if (!isValidId(id)) throw new Error("Invalid project ID");

	// whitelist fields
	const updateData = {};
	for (const key of ALLOWED_UPDATE_FIELDS) {
		if (data[key] !== undefined) {
			updateData[key] = data[key];
		}
	}

	if (!Object.keys(updateData).length) {
		throw Object.assign(new Error("No valid fields to update"), { statusCode: 400 });
	}

	// Load project to perform authorization checks (managerIds, departmentId)
	const proj = await Project.findOne({ _id: id, companyId }).select(
		"managerIds testerIds departmentId testingPhases"
	);
	if (!proj) throw Object.assign(new Error("Project not found"), { statusCode: 404 });

	const isAdmin = role === "admin" || role === "super_admin";

	// Department head may update only projects in their department
	if (role === "department_head") {
		if (!proj.departmentId || String(proj.departmentId) !== String(departmentId)) {
			throw Object.assign(new Error("Not authorized to update this project"), { statusCode: 403 });
		}
	}

	// Project managers are recorded per-project in managerIds. Allow update if the requester is listed.
	const managerIds = (proj.managerIds || []).map((m) => String(m));
	const isProjectManagerForThis = managerIds.includes(String(userId));

	if (!isAdmin && role !== "department_head" && !isProjectManagerForThis) {
		// Not an admin, not a department head for this project, and not a manager on the project
		throw Object.assign(new Error("Not authorized to update this project"), { statusCode: 403 });
	}

	// When transitioning to QA_TESTING, initialize testing phases if not already set
	if (
		updateData.status === "QA_TESTING" &&
		(!proj.testingPhases || proj.testingPhases.length === 0)
	) {
		updateData.testingPhases = [
			{ name: "Frontend Testing", weight: 25, status: "PENDING" },
			{ name: "Backend Testing", weight: 25, status: "PENDING" },
			{ name: "Cybersecurity Testing", weight: 25, status: "PENDING" },
			{ name: "SEO / Performance", weight: 25, status: "PENDING" },
		];
	}

	updateData.updated_by = userId;

	const project = await Project.findOneAndUpdate({ _id: id, companyId }, updateData, {
		new: true,
		runValidators: true,
	});

	if (!project)
		throw Object.assign(new Error("Project not found or unauthorized"), { statusCode: 404 });

	return project;
};

// update a specific testing phase (tester or PM on this project)
export const updateTestingPhaseService = async ({ id, companyId, userId, data }) => {
	if (!isValidId(id)) throw Object.assign(new Error("Invalid project ID"), { statusCode: 400 });

	const { phaseIndex, status } = data || {};

	if (phaseIndex === undefined || phaseIndex === null)
		throw Object.assign(new Error("phaseIndex is required"), { statusCode: 400 });

	if (!["PASSED", "FAILED", "PENDING"].includes(status))
		throw Object.assign(new Error("status must be PASSED, FAILED, or PENDING"), {
			statusCode: 400,
		});

	const project = await Project.findOne({ _id: id, companyId });
	if (!project) throw Object.assign(new Error("Project not found"), { statusCode: 404 });

	// Authorization: tester or manager listed on this project
	const isTester = (project.testerIds || []).map(String).includes(String(userId));
	const isManager = (project.managerIds || []).map(String).includes(String(userId));
	if (!isTester && !isManager)
		throw Object.assign(new Error("Not authorized to update testing phases"), { statusCode: 403 });

	if (project.status !== "QA_TESTING")
		throw Object.assign(new Error("Project is not in QA_TESTING"), { statusCode: 400 });

	const idx = Number(phaseIndex);
	if (!Number.isFinite(idx) || idx < 0 || idx >= (project.testingPhases || []).length)
		throw Object.assign(new Error("Invalid phase index"), { statusCode: 400 });

	project.testingPhases[idx].status = status;
	project.testingPhases[idx].completedAt = status !== "PENDING" ? new Date() : null;
	project.testingPhases[idx].completedBy = status !== "PENDING" ? userId : null;
	project.markModified("testingPhases");
	await project.save();
	return project;
};

// delete
export const deleteProjectService = async ({ id, companyId, departmentId, role }) => {
	if (!isValidId(id)) throw new Error("Invalid project ID");

	const query = { _id: id, companyId };

	if (role === "department_head") {
		query.departmentId = departmentId;
	}

	const project = await Project.findOneAndDelete(query);

	if (!project) throw new Error("Project not found or unauthorized");

	return true;
};

// ─── SRS Cloudinary helpers ───────────────────────────────────────────────────
// TO-DO
// function uploadSrsToCloudinary(buffer, originalName, folder) {
// 	return new Promise((resolve, reject) => {
// 		const stream = cloudinary.uploader.upload_stream(
// 			{
// 				folder,
// 				resource_type: "raw",
// 				public_id: originalName,
// 				use_filename: true,
// 				unique_filename: true,
// 				overwrite: false,
// 			},
// 			(error, result) => {
// 				if (error) return reject(error);
// 				resolve(result);
// 			}
// 		);
// 		Readable.from(buffer).pipe(stream);
// 	});
// }

// async function deleteSrsFromCloudinary(publicId) {
// 	try {
// 		await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
// 	} catch {
// 		// non-fatal
// 	}
// }

// // ─── SRS service functions ────────────────────────────────────────────────────

// export const uploadSrsService = async ({ id, companyId, file }) => {
// 	if (!isValidId(id)) throw Object.assign(new Error("Invalid project ID"), { statusCode: 400 });

// 	const project = await Project.findOne({ _id: id, companyId });
// 	if (!project) throw Object.assign(new Error("Project not found"), { statusCode: 404 });

// 	// Delete old SRS if exists
// 	if (project.srsDocument?.publicId) {
// 		await deleteSrsFromCloudinary(project.srsDocument.publicId);
// 	}

// 	const result = await uploadSrsToCloudinary(
// 		file.buffer,
// 		file.originalname,
// 		`srs-documents/${companyId}`
// 	);

// 	return Project.findByIdAndUpdate(
// 		id,
// 		{ srsDocument: { url: result.secure_url, publicId: result.public_id } },
// 		{ new: true }
// 	).select("-__v");
// };

// export const getSrsService = async ({ id, companyId }) => {
// 	if (!isValidId(id)) throw Object.assign(new Error("Invalid project ID"), { statusCode: 400 });

// 	const project = await Project.findOne({ _id: id, companyId }).select("srsDocument");
// 	if (!project) throw Object.assign(new Error("Project not found"), { statusCode: 404 });

// 	return project.srsDocument;
// };

// export const deleteSrsService = async ({ id, companyId }) => {
// 	if (!isValidId(id)) throw Object.assign(new Error("Invalid project ID"), { statusCode: 400 });

// 	const project = await Project.findOne({ _id: id, companyId });
// 	if (!project) throw Object.assign(new Error("Project not found"), { statusCode: 404 });

// 	if (!project.srsDocument?.publicId) {
// 		throw Object.assign(new Error("No SRS document to delete"), { statusCode: 404 });
// 	}

// 	await deleteSrsFromCloudinary(project.srsDocument.publicId);

// 	return Project.findByIdAndUpdate(
// 		id,
// 		{ srsDocument: { url: null, publicId: null } },
// 		{ new: true }
// 	).select("-__v");
// };
