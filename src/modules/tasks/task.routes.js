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
router.post("/", verifyAccessToken, verifyRole(["admin", "department_head", "lead", "contributor", "reviewer", "employee"]), verifyPermission("tasks", "create"), createTask);

// Get all tasks
router.get("/", verifyAccessToken, verifyRole(["admin", "department_head", "lead", "contributor", "reviewer", "employee"]), verifyPermission("tasks", "read"), getTasks);

// Get a single task by ID
router.get("/:id", verifyAccessToken, verifyRole(["admin", "department_head", "lead", "contributor", "reviewer", "employee"]), verifyPermission("tasks", "read"), getTaskById);

// Advance task to next status
router.patch("/:id/advance", verifyAccessToken, verifyRole(["admin", "department_head", "lead", "contributor", "reviewer", "employee"]), advanceTask);

// Start tester review timing
router.patch("/:id/start-review", verifyAccessToken, verifyRole(["admin", "department_head", "lead", "contributor", "reviewer", "employee"]), verifyPermission("tasks", "update"), startTesterReview);

// Assign contributors / reviewers
router.patch("/:id/assign", verifyAccessToken, verifyRole(["admin", "department_head", "lead", "contributor", "reviewer", "employee"]), verifyPermission("tasks", "update"), assignTask);

// Update task fields
router.patch("/:id", verifyAccessToken, verifyRole(["admin", "department_head", "lead", "contributor", "reviewer", "employee"]), verifyPermission("tasks", "update"), updateTask);

// Delete a task
router.delete("/:id", verifyAccessToken, verifyRole(["admin", "department_head", "lead"]), verifyPermission("tasks", "delete"), deleteTask);

// Upload an attachment to a task
router.post("/:id/attachments", verifyAccessToken, verifyRole(["admin", "department_head", "lead", "contributor", "reviewer", "employee"]), verifyPermission("tasks", "update"), uploadTaskFile, uploadTaskAttachment);

// Delete an attachment from a task
router.delete("/:id/attachments", verifyAccessToken, verifyRole(["admin", "department_head", "lead", "contributor", "reviewer", "employee"]), verifyPermission("tasks", "update"), deleteTaskAttachment);

// Add a note to a completed task (admin/dept-head/lead only)
router.post("/:id/notes", verifyAccessToken, verifyRole(["admin", "department_head", "lead"]), async (req, res, next) => {
	try {
		const { text } = req.body;
		if (!text?.trim()) return res.status(400).json({ error: "Note text is required" });
		const Task = (await import("./task.model.js")).default;
		const task = await Task.findOneAndUpdate(
			{ _id: req.params.id, companyId: req.companyId },
			{ $push: { notes: { authorId: req.userId, authorName: req.body.authorName || "", text: text.trim() } } },
			{ new: true }
		);
		if (!task) return res.status(404).json({ error: "Task not found" });
		res.status(200).json({ task });
	} catch (err) { next(err); }
});

export default router;
