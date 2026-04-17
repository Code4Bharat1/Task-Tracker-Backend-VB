import { Router } from "express";
import {
  deleteCompanyController,
  getCompaniesController,
  getCompanyByIdController,
  registerCompanyController,
  updateCompanyController,
  getRolePermissionsController,
  updateRolePermissionsController,
} from "./companies.controller.js";
import verifyAccessToken from "../../middlewares/verifyAccessToken.middleware.js";
import verifyRole from "../../middlewares/verifyRole.middleware.js";

const router = Router();

router.post("/", registerCompanyController);
router.get("/", getCompaniesController);

// Role permissions — read: any authenticated user, write: admin only
router.get("/permissions/roles", verifyAccessToken, getRolePermissionsController);
router.patch("/permissions/roles", verifyAccessToken, verifyRole("admin"), updateRolePermissionsController);

router.get("/:id", getCompanyByIdController);
router.patch("/:companyId", updateCompanyController);
router.delete("/:companyId", deleteCompanyController);

export default router;
