import { Router } from "express";
import verifyAccessToken from "../../middlewares/verifyAccessToken.middleware.js";
import verifyRole from "../../middlewares/verifyRole.middleware.js";
import verifyPermission from "../../middlewares/verifyPermission.middleware.js";
import { createDailyLog, getDailyLogs, getDailyLogById, updateDailyLog, deleteDailyLog, uploadEntryScreenshot } from "./dailyLog.controller.js";
import { uploadImage } from "../../middlewares/upload.js";

const router = Router();

router.post("/", verifyAccessToken, verifyRole(["admin", "department_head", "lead", "employee"]), verifyPermission("dailyLogs", "create"), createDailyLog);
router.get("/", verifyAccessToken, verifyRole(["admin", "department_head", "lead", "employee"]), verifyPermission("dailyLogs", "read"), getDailyLogs);
router.get("/:id", verifyAccessToken, verifyRole(["admin", "department_head", "lead", "employee"]), verifyPermission("dailyLogs", "read"), getDailyLogById);
router.patch("/:id", verifyAccessToken, verifyRole(["admin", "department_head", "lead", "employee"]), verifyPermission("dailyLogs", "update"), updateDailyLog);
router.delete("/:id", verifyAccessToken, verifyRole(["admin", "department_head", "lead", "employee"]), verifyPermission("dailyLogs", "delete"), deleteDailyLog);
router.post("/:id/entries/:entryId/screenshot", verifyAccessToken, verifyRole(["admin", "department_head", "lead", "employee"]), verifyPermission("dailyLogs", "update"), uploadImage, uploadEntryScreenshot);

export default router;
