import { Router } from "express";
import {
  deleteCompanyController,
  getCompaniesController,
  getCompanyByIdController,
  registerCompanyController,
  updateCompanyController,
} from "./companies.controller.js";

const router = Router();

// All company routes are super_admin only
// router.use(verifyAccessToken, verifyRole("super_admin"));

router.post("/", registerCompanyController);              // CREATE company + admin
router.get("/", getCompaniesController);                  // GET all companies (paginated)
router.get("/:id", getCompanyByIdController);             // GET company by ID
router.patch("/:companyId", updateCompanyController);     // UPDATE company (name, status, workingDays, shiftStart, shiftEnd)
router.delete("/:companyId", deleteCompanyController);    // DELETE company

export default router;
