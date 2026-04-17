import { Router } from "express";
import {
	createUser,
	getUsers,
	getUserById,
	updateUser,
	updateMe,
	deleteUser,
	getAllUsers,
	getColleagues,
	uploadProfilePic,
	getProfilePic,
	deleteProfilePic,
} from "./user.controller.js";
import verifyAccessToken from "../../middlewares/verifyAccessToken.middleware.js";
import verifyRole from "../../middlewares/verifyRole.middleware.js";
import { uploadProfilePic as uploadProfilePicMiddleware } from "../../middlewares/upload.js";

const router = Router();

// super_admin: get all users across the entire DB (must be before /:id)
router.get("/all", verifyAccessToken, verifyRole("super_admin"), getAllUsers);

// Any authenticated user: lightweight colleague list (name/email/role only)
router.get("/colleagues", verifyAccessToken, getColleagues);

// Any authenticated user: update own profile
router.patch("/me", verifyAccessToken, updateMe);

// admin + department_head scoped routes
router.post("/", verifyAccessToken, verifyRole(["admin", "department_head"]), createUser);
router.get("/", verifyAccessToken, verifyRole(["admin", "department_head"]), getUsers);
router.get("/:id", verifyAccessToken, verifyRole(["admin", "department_head"]), getUserById);
router.patch("/:id", verifyAccessToken, verifyRole(["admin", "department_head"]), updateUser);
router.delete("/:id", verifyAccessToken, verifyRole(["admin", "department_head"]), deleteUser);

// Profile pic routes
router.get("/:id/profile-pic", verifyAccessToken, getProfilePic);
router.post("/:id/profile-pic", verifyAccessToken, uploadProfilePicMiddleware, uploadProfilePic);
router.delete("/:id/profile-pic", verifyAccessToken, deleteProfilePic);

export default router;
