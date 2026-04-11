import { Router } from "express";
import verifyAccessToken from "../../middlewares/verifyAccessToken.middleware.js";
import verifyRole from "../../middlewares/verifyRole.middleware.js";
import { assignModule, getModuleAssignments, removeModuleAssignment } from "./moduleAssignment.controller.js";

const router = Router();

router.post("/", verifyAccessToken, verifyRole(["admin", "department_head"]), assignModule);
router.get("/", verifyAccessToken, verifyRole(["admin", "department_head", "employee"]), getModuleAssignments);
router.delete("/:id", verifyAccessToken, verifyRole(["admin", "department_head"]), removeModuleAssignment);

export default router;
