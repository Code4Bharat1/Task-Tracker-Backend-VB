import { Router } from "express";
import verifyAccessToken from "../../middlewares/verifyAccessToken.middleware.js";
import verifyRole from "../../middlewares/verifyRole.middleware.js";
import verifyPermission from "../../middlewares/verifyPermission.middleware.js";
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

// Create a task
router.post("/", verifyAccessToken, verifyRole(["admin", "department_head", "lead", "employee"]), verifyPermission("tasks", "create"), createTask);

// Get all tasks
router.get("/", verifyAccessToken, verifyRole(["admin", "department_head", "lead", "employee"]), verifyPermission("tasks", "read"), getTasks);

// Get a single task by ID
router.get("/:id", verifyAccessToken, verifyRole(["admin", "department_head", "lead", "employee"]), verifyPermission("tasks", "read"), getTaskById);

// Advance task to next status
router.patch("/:id/advance", verifyAccessToken, verifyRole(["admin", "department_head", "lead", "employee"]), verifyPermission("tasks", "update"), advanceTask);

// Start tester review timing
router.patch("/:id/start-review", verifyAccessToken, verifyRole(["admin", "department_head", "lead", "employee"]), verifyPermission("tasks", "update"), startTesterReview);

// Assign contributors / reviewers
router.patch("/:id/assign", verifyAccessToken, verifyRole(["admin", "department_head", "lead", "employee"]), verifyPermission("tasks", "update"), assignTask);

// Update task fields
router.patch("/:id", verifyAccessToken, verifyRole(["admin", "department_head", "lead", "employee"]), verifyPermission("tasks", "update"), updateTask);

// Delete a task
router.delete("/:id", verifyAccessToken, verifyRole(["admin", "department_head", "lead"]), verifyPermission("tasks", "delete"), deleteTask);

// Upload an attachment to a task
router.post("/:id/attachments", verifyAccessToken, verifyRole(["admin", "department_head", "lead", "employee"]), verifyPermission("tasks", "update"), uploadTaskFile, uploadTaskAttachment);

// Delete an attachment from a task
router.delete("/:id/attachments", verifyAccessToken, verifyRole(["admin", "department_head", "lead", "employee"]), verifyPermission("tasks", "update"), deleteTaskAttachment);

export default router;
