import { Router } from "express";
import verifyAccessToken from "../../middlewares/verifyAccessToken.middleware.js";
import verifyRole from "../../middlewares/verifyRole.middleware.js";
import {
	createReport,
	getReports,
	getReportById,
	updateReport,
	deleteReport,
	getMyReports,
} from "./reports.controller.js";

const router = Router();

router.post("/", verifyAccessToken, verifyRole(["admin", "department_head", "lead", "employee"]), createReport);

// /my-reports MUST be before /:id
router.get("/my-reports", verifyAccessToken, getMyReports);

router.get("/", verifyAccessToken, verifyRole(["admin", "department_head", "lead"]), getReports);
router.get("/:id", verifyAccessToken, getReportById);

// Any authenticated user can update/delete their own report (controller enforces ownership)
router.patch("/:id", verifyAccessToken, updateReport);
router.delete("/:id", verifyAccessToken, deleteReport);

export default router;
