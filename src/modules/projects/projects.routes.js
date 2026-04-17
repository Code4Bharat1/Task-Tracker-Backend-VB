import { Router } from "express";
import verifyAccessToken from "../../middlewares/verifyAccessToken.middleware.js";
import verifyRole from "../../middlewares/verifyRole.middleware.js";
import verifyPermission from "../../middlewares/verifyPermission.middleware.js";
import {
	createProject,
	getProjects,
	getProjectById,
	getMyProjects,
	assignProjectTeam,
	updateProject,
	updateTestingPhase,
	deleteProject,
	uploadSrs,
	getSrs,
	deleteSrs,
} from "./projects.controller.js";
import { uploadDocument } from "../../middlewares/upload.js";

const router = Router();

router.post("/", verifyAccessToken, verifyRole(["admin", "department_head", "lead"]), verifyPermission("projects", "create"), createProject);
router.get("/", verifyAccessToken, verifyRole(["admin", "department_head", "lead"]), verifyPermission("projects", "read"), getProjects);
router.get("/my-projects", verifyAccessToken, getMyProjects);
router.patch("/:id/team", verifyAccessToken, verifyRole(["admin", "department_head", "lead"]), assignProjectTeam);
router.get("/:id", verifyAccessToken, verifyPermission("projects", "read"), getProjectById);
router.patch("/:id", verifyAccessToken, verifyPermission("projects", "update"), updateProject);
router.patch("/:id/testing-phases", verifyAccessToken, updateTestingPhase);
router.delete("/:id", verifyAccessToken, verifyRole(["admin", "department_head", "lead"]), verifyPermission("projects", "delete"), deleteProject);

// SRS document routes
router.get("/:id/srs", verifyAccessToken, getSrs);
router.post("/:id/srs", verifyAccessToken, verifyRole(["department_head", "lead"]), uploadDocument, uploadSrs);
router.put("/:id/srs", verifyAccessToken, verifyRole(["department_head", "lead"]), uploadDocument, uploadSrs);
router.delete("/:id/srs", verifyAccessToken, verifyRole(["department_head", "lead"]), deleteSrs);

export default router;
