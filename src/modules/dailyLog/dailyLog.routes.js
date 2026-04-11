import { Router } from "express";
import verifyAccessToken from "../../middlewares/verifyAccessToken.middleware.js";
import verifyRole from "../../middlewares/verifyRole.middleware.js";
import { createDailyLog, getDailyLogs, getDailyLogById, updateDailyLog, deleteDailyLog } from "./dailyLog.controller.js";

const router = Router();

router.post("/", verifyAccessToken, verifyRole(["admin", "department_head", "employee"]), createDailyLog);
router.get("/", verifyAccessToken, verifyRole(["admin", "department_head", "employee"]), getDailyLogs);
router.get("/:id", verifyAccessToken, verifyRole(["admin", "department_head", "employee"]), getDailyLogById);
router.patch("/:id", verifyAccessToken, verifyRole(["admin", "department_head", "employee"]), updateDailyLog);
router.delete("/:id", verifyAccessToken, verifyRole(["admin", "department_head", "employee"]), deleteDailyLog);

export default router;
