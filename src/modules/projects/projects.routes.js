import { Router } from "express";
import verifyAccessToken from "../../middlewares/verifyAccessToken.middleware.js";
import verifyRole from "../../middlewares/verifyRole.middleware.js";
// import { uploadDocument } from "../../middlewares/upload.js";
import {
	createProject,
	getProjects,
	getProjectById,
	getMyProjects,
	assignProjectTeam,
	updateProject,
	updateTestingPhase,
	deleteProject,
	// uploadSrs,
	// getSrs,
	// deleteSrs,
} from "./projects.controller.js";

const router = Router();

router.post("/", verifyAccessToken, verifyRole(["admin", "department_head"]), createProject); // CREATE PROJECT
router.get("/", verifyAccessToken, verifyRole(["admin", "department_head"]), getProjects); // GET PROJECTS
router.get("/my-projects", verifyAccessToken, getMyProjects); // GET MY PROJECTS=
router.patch("/:id/team", verifyAccessToken, verifyRole("department_head|project_manager"), assignProjectTeam); // ASSIGN/UPDATE TEAM
router.get("/:id", verifyAccessToken, getProjectById); // GET PROJECT BY ID
router.patch("/:id", verifyAccessToken, updateProject); // UPDATE PROJECT
router.patch("/:id/testing-phases", verifyAccessToken, updateTestingPhase); // UPDATE TESTING PHASE
router.delete("/:id", verifyAccessToken, verifyRole(["admin", "department_head"]), deleteProject); // DELETE PROJECT

// SRS document routes
/* TO-DO
router.get("/:id/upload-srs", verifyAccessToken, verifyRole(["department_head"]), getSrs);
router.post("/:id/upload-srs", verifyAccessToken, verifyRole(["department_head"]), uploadDocument, uploadSrs);
router.put("/:id/upload-srs", verifyAccessToken, verifyRole(["department_head"]), uploadDocument, uploadSrs);
router.delete("/:id/upload-srs", verifyAccessToken, verifyRole(["department_head"]), deleteSrs);
*/
export default router;
