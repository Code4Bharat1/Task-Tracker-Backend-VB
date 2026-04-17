import { Router } from "express";
import verifyAccessToken from "../../middlewares/verifyAccessToken.middleware.js";
import verifyRole from "../../middlewares/verifyRole.middleware.js";
import verifyPermission from "../../middlewares/verifyPermission.middleware.js";
import { createBug, getBugs, getBugById, updateBug, deleteBug } from "./bugs.controller.js";

const router = Router();

router.post("/", verifyAccessToken, verifyRole(["admin", "department_head", "lead", "employee"]), verifyPermission("bugs", "create"), createBug);
router.get("/", verifyAccessToken, verifyRole(["admin", "department_head", "lead", "employee"]), verifyPermission("bugs", "read"), getBugs);
router.get("/:id", verifyAccessToken, verifyRole(["admin", "department_head", "lead", "employee"]), verifyPermission("bugs", "read"), getBugById);
router.patch("/:id", verifyAccessToken, verifyRole(["admin", "department_head", "lead", "employee"]), verifyPermission("bugs", "update"), updateBug);
router.delete("/:id", verifyAccessToken, verifyRole(["admin", "department_head", "lead"]), verifyPermission("bugs", "delete"), deleteBug);

export default router;
