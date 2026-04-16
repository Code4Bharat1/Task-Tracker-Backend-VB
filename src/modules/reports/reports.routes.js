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

router.post(
	"/",
	verifyAccessToken,
	verifyRole(["admin", "department_head", "project_manager", "employee"]),
	createReport
);
router.get(
	"/",
	verifyAccessToken,
	verifyRole(["admin", "department_head", "project_manager"]),
	getReports
);
router.get("/my-reports", verifyAccessToken, getMyReports);
router.get("/:id", verifyAccessToken, getReportById);
router.patch(
	"/:id",
	verifyAccessToken,
	verifyRole(["admin", "department_head", "project_manager"]),
	updateReport
);
router.delete(
	"/:id",
	verifyAccessToken,
	verifyRole(["admin", "department_head", "project_manager"]),
	deleteReport
);

export default router;
