import { Router } from "express";
import {
	createDepartment,
	getDepartments,
	getDepartmentById,
	getDepartmentMembers,
	updateDepartment,
	deleteDepartment,
} from "./departments.controller.js";
import verifyAccessToken from "../../middlewares/verifyAccessToken.middleware.js";
import verifyRole from "../../middlewares/verifyRole.middleware.js";

const router = Router();

router.post("/", verifyAccessToken, verifyRole("admin"), createDepartment);                                      // CREATE
router.get("/", verifyAccessToken, verifyRole(["admin", "department_head"]), getDepartments);                    // GET ALL
router.get("/:id/members", verifyAccessToken, verifyRole(["admin", "department_head"]), getDepartmentMembers);      // GET MEMBERS
router.get("/:id", verifyAccessToken, verifyRole(["admin", "department_head"]), getDepartmentById);              // GET ONE
router.patch("/:id", verifyAccessToken, verifyRole("admin"), updateDepartment);                                  // UPDATE (PATCH)
router.delete("/:id", verifyAccessToken, verifyRole("admin"), deleteDepartment);                                 // DELETE

export default router;
