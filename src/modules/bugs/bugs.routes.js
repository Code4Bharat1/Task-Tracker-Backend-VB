import { Router } from "express";
import verifyAccessToken from "../../middlewares/verifyAccessToken.middleware.js";
import verifyRole from "../../middlewares/verifyRole.middleware.js";
import { createBug, getBugs, getBugById, updateBug, deleteBug, getMyBugs, getBugsReportedByMe } from "./bugs.controller.js";

const router = Router();

router.post("/", verifyAccessToken, verifyRole(["admin", "department_head", "employee"]), createBug);
router.get("/", verifyAccessToken, verifyRole(["admin", "department_head", "employee"]), getBugs);
router.get("/my-bugs", verifyAccessToken, verifyRole(["employee"]), getMyBugs);
router.get("/reported-by-me", verifyAccessToken, verifyRole(["employee", "admin", "department_head"]), getBugsReportedByMe);
router.get("/:id", verifyAccessToken, verifyRole(["admin", "department_head", "employee"]), getBugById);
router.patch("/:id", verifyAccessToken, verifyRole(["admin", "department_head", "employee"]), updateBug);
router.delete("/:id", verifyAccessToken, verifyRole(["admin", "department_head"]), deleteBug);

export default router;
