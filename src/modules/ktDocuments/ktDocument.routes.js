import { Router } from "express";
import verifyAccessToken from "../../middlewares/verifyAccessToken.middleware.js";
import verifyRole from "../../middlewares/verifyRole.middleware.js";
import { uploadDocument } from "../../middlewares/upload.js";
import {
  createKtDocument,
  getKtDocuments,
  getKtDocumentById,
  updateKtDocument,
  deleteKtDocument,
} from "./ktDocument.controller.js";

const router = Router();

// Only department_head can create / update / delete
// uploadDocument validates mime type, extension, and size (10 MB max)
router.post(
  "/",
  verifyAccessToken,
  verifyRole("department_head"),
  uploadDocument,
  createKtDocument
);

router.get(
  "/",
  verifyAccessToken,
  verifyRole(["admin", "department_head", "employee"]),
  getKtDocuments
);

router.get(
  "/:id",
  verifyAccessToken,
  verifyRole(["admin", "department_head", "employee"]),
  getKtDocumentById
);

router.patch(
  "/:id",
  verifyAccessToken,
  verifyRole("department_head"),
  uploadDocument,
  updateKtDocument
);

router.delete(
  "/:id",
  verifyAccessToken,
  verifyRole("department_head"),
  deleteKtDocument
);

export default router;
