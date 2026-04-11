import { Router } from "express";
import verifyAccessToken from "../../middlewares/verifyAccessToken.middleware.js";
import verifyRole from "../../middlewares/verifyRole.middleware.js";
import { getActivityLogs, getActivityLogsByEntity } from "./activityLog.controller.js";

const router = Router();

// GET /api/v1/activity-logs?userId=&entity=&page=&limit=
router.get("/", verifyAccessToken, verifyRole(["admin", "department_head"]), getActivityLogs);

// GET /api/v1/activity-logs/:entity/:entityId
router.get("/:entity/:entityId", verifyAccessToken, verifyRole(["admin", "department_head", "employee"]), getActivityLogsByEntity);

export default router;
