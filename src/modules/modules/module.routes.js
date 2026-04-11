import { Router } from "express";
import verifyAccessToken from "../../middlewares/verifyAccessToken.middleware.js";
import verifyRole from "../../middlewares/verifyRole.middleware.js";
import {
	createModule,
	getModules,
	getModuleById,
	updateModule,
	deleteModule,
	advanceModule,
} from "./module.controller.js";

const router = Router();

router.post(
	"/",
	verifyAccessToken,
	verifyRole(["admin", "department_head", "employee"]),
	createModule
);
router.get(
	"/",
	verifyAccessToken,
	verifyRole(["admin", "department_head", "employee"]),
	getModules
);
router.get(
	"/:id",
	verifyAccessToken,
	verifyRole(["admin", "department_head", "employee"]),
	getModuleById
);
router.patch(
	"/:id/advance",
	verifyAccessToken,
	verifyRole(["admin", "department_head", "employee"]),
	advanceModule
);
router.patch(
	"/:id",
	verifyAccessToken,
	verifyRole(["admin", "department_head", "employee"]),
	updateModule
);
router.delete(
	"/:id",
	verifyAccessToken,
	verifyRole(["admin", "department_head", "employee"]),
	deleteModule
);

export default router;
