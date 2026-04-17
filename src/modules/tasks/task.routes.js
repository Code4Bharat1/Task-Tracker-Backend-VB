import { Router } from "express";
import verifyAccessToken from "../../middlewares/verifyAccessToken.middleware.js";
import verifyRole from "../../middlewares/verifyRole.middleware.js";
import verifyPermission from "../../middlewares/verifyPermission.middleware.js";
import {
	createTask, getTasks, getTaskById, updateTask,
	assignTask, deleteTask, advanceTask,
	uploadTaskAttachment, deleteTaskAttachment,
} from "./task.controller.js";
import { uploadTaskFile } from "../../middlewares/upload.js";

const router = Router();

router.post("/", verifyAccessToken, verifyRole(["admin", "department_head", "lead"]), verifyPermission("tasks", "create"), createTask);
router.get("/", verifyAccessToken, verifyRole(["admin", "department_head", "lead", "employee"]), verifyPermission("tasks", "read"), getTasks);
router.get("/:id", verifyAccessToken, verifyRole(["admin", "department_head", "lead", "employee"]), verifyPermission("tasks", "read"), getTaskById);
router.patch("/:id/advance", verifyAccessToken, verifyRole(["admin", "department_head", "lead", "employee"]), verifyPermission("tasks", "update"), advanceTask);
router.patch("/:id/assign", verifyAccessToken, verifyRole(["admin", "department_head", "lead"]), verifyPermission("tasks", "update"), assignTask);
router.patch("/:id", verifyAccessToken, verifyRole(["admin", "department_head", "lead", "employee"]), verifyPermission("tasks", "update"), updateTask);
router.delete("/:id", verifyAccessToken, verifyRole(["admin", "department_head", "lead"]), verifyPermission("tasks", "delete"), deleteTask);
router.post("/:id/attachments", verifyAccessToken, verifyRole(["admin", "department_head", "lead", "employee"]), verifyPermission("tasks", "update"), uploadTaskFile, uploadTaskAttachment);
router.delete("/:id/attachments", verifyAccessToken, verifyRole(["admin", "department_head", "lead", "employee"]), verifyPermission("tasks", "update"), deleteTaskAttachment);

export default router;
