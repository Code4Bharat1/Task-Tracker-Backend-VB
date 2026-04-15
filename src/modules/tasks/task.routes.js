import { Router } from "express";
import verifyAccessToken from "../../middlewares/verifyAccessToken.middleware.js";
import verifyRole from "../../middlewares/verifyRole.middleware.js";
import {
	createTask,
	getTasks,
	getTaskById,
	updateTask,
	assignTask,
	deleteTask,
	advanceTask,
} from "./task.controller.js";

const router = Router();

// Create a task — Lead only (admin, department_head, project_manager)
router.post(
	"/",
	verifyAccessToken,
	verifyRole(["admin", "department_head", "project_manager"]),
	createTask
);

// Get all tasks — all authenticated roles
router.get("/", verifyAccessToken, verifyRole(["admin", "department_head", "employee"]), getTasks);

// Get a single task by ID
router.get(
	"/:id",
	verifyAccessToken,
	verifyRole(["admin", "department_head", "employee"]),
	getTaskById
);

// Advance task to next status
router.patch(
	"/:id/advance",
	verifyAccessToken,
	verifyRole(["admin", "department_head", "employee"]),
	advanceTask
);

// Assign contributors / reviewers — Lead only
router.patch(
	"/:id/assign",
	verifyAccessToken,
	verifyRole(["admin", "department_head", "project_manager"]),
	assignTask
);

// Update task fields — Lead can update all fields; employees can update status/completionNote
router.patch(
	"/:id",
	verifyAccessToken,
	verifyRole(["admin", "department_head", "project_manager", "employee"]),
	updateTask
);

// Delete a task — Lead only
router.delete(
	"/:id",
	verifyAccessToken,
	verifyRole(["admin", "department_head", "project_manager"]),
	deleteTask
);

export default router;
