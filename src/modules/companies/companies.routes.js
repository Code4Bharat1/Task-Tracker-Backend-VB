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

// Role permissions — must be BEFORE /:id to avoid "permissions" being treated as an ID
router.get("/permissions/roles", verifyAccessToken, verifyRole("admin"), getRolePermissionsController);
router.patch("/permissions/roles", verifyAccessToken, verifyRole("admin"), updateRolePermissionsController);

router.get("/:id", getCompanyByIdController);
router.patch("/:companyId", updateCompanyController);
router.delete("/:companyId", deleteCompanyController);

export default router;
