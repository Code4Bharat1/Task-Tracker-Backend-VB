import { Router } from "express";
import verifyAccessToken from "../../middlewares/verifyAccessToken.middleware.js";
import verifyRole from "../../middlewares/verifyRole.middleware.js";
import verifyPermission from "../../middlewares/verifyPermission.middleware.js";
import {
	createReport,
	getReports,
	getReportById,
	updateReport,
	deleteReport,
	getMyReports,
} from "./reports.controller.js";

const router = Router();

router.post("/", verifyAccessToken, verifyRole(["admin", "department_head", "lead", "contributor", "reviewer", "employee"]), verifyPermission("reports", "create"), createReport);

// /my-reports MUST be before /:id
router.get("/my-reports", verifyAccessToken, verifyPermission("reports", "read"), getMyReports);

router.get("/", verifyAccessToken, verifyRole(["admin", "department_head", "lead", "contributor", "reviewer"]), verifyPermission("reports", "read"), getReports);
router.get("/:id", verifyAccessToken, verifyPermission("reports", "read"), getReportById);

// Any authenticated user can update/delete their own report (controller enforces ownership)
router.patch("/:id", verifyAccessToken, verifyPermission("reports", "update"), updateReport);
router.delete("/:id", verifyAccessToken, verifyPermission("reports", "delete"), deleteReport);

export default router;
