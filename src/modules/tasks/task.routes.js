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
	startTesterReview,
	uploadTaskAttachment,
	deleteTaskAttachment,
} from "./task.controller.js";
import { uploadTaskFile } from "../../middlewares/upload.js";

const router = Router();

// Create a task — Lead only (admin, department_head, employee)
router.post(
	"/",
	verifyAccessToken,
	verifyRole(["admin", "department_head", "employee"]),
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

// Start tester review timing
router.patch(
	"/:id/start-review",
	verifyAccessToken,
	verifyRole(["admin", "department_head", "employee"]),
	startTesterReview
);

// Assign contributors / reviewers — Lead only
router.patch(
	"/:id/assign",
	verifyAccessToken,
	verifyRole(["admin", "department_head", "employee"]),
	assignTask
);

// Update task fields — Lead can update all fields; employees can update status/completionNote
router.patch(
	"/:id",
	verifyAccessToken,
	verifyRole(["admin", "department_head", "employee"]),
	updateTask
);

// Delete a task — Lead only
router.delete(
	"/:id",
	verifyAccessToken,
	verifyRole(["admin", "department_head", "employee"]),
	deleteTask
);

// Upload an attachment to a task
router.post(
	"/:id/attachments",
	verifyAccessToken,
	verifyRole(["admin", "department_head", "employee"]),
	uploadTaskFile,
	uploadTaskAttachment
);

// Delete an attachment from a task
router.delete(
	"/:id/attachments",
	verifyAccessToken,
	verifyRole(["admin", "department_head", "employee"]),
	deleteTaskAttachment
);

export default router;
