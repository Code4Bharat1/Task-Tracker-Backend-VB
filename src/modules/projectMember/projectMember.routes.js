import { Router } from "express";
import verifyAccessToken from "../../middlewares/verifyAccessToken.middleware.js";
import ProjectMembersModel from "./projectMember.model.js";
import verifyRole from "../../middlewares/verifyRole.middleware.js";
import { createProjectMember, deleteProjectMember, getAllProjectMembers, getSingleProjectMember, updateProjectMember } from "./projectMember.conroller.js";

const router = Router();

router.post("/", verifyAccessToken, verifyRole("department_head"), createProjectMember);
router.get("/", verifyAccessToken, verifyRole("department_head"), getAllProjectMembers);
router.get("/:id", verifyAccessToken, verifyRole("department_head"), getSingleProjectMember);
router.put("/:id", verifyAccessToken, verifyRole("department_head"), updateProjectMember);
router.delete("/:id", verifyAccessToken, verifyRole("department_head"), deleteProjectMember);

export default router;