import { Router } from "express";
import verifyAccessToken from "../../middlewares/verifyAccessToken.middleware.js";
import verifyRole from "../../middlewares/verifyRole.middleware.js";
import verifyPermission from "../../middlewares/verifyPermission.middleware.js";
import { uploadDocument } from "../../middlewares/upload.js";
import {
  createKtDocument,
  getKtDocuments,
  getKtDocumentById,
  updateKtDocument,
  deleteKtDocument,
} from "./ktDocument.controller.js";

const router = Router();

router.post(
  "/",
  verifyAccessToken,
  verifyRole("department_head"),
  verifyPermission("ktDocuments", "create"),
  uploadDocument,
  createKtDocument
);

router.get(
  "/",
  verifyAccessToken,
  verifyRole(["admin", "department_head", "employee"]),
  verifyPermission("ktDocuments", "read"),
  getKtDocuments
);

router.get(
  "/:id",
  verifyAccessToken,
  verifyRole(["admin", "department_head", "employee"]),
  verifyPermission("ktDocuments", "read"),
  getKtDocumentById
);

router.patch(
  "/:id",
  verifyAccessToken,
  verifyRole("department_head"),
  verifyPermission("ktDocuments", "update"),
  uploadDocument,
  updateKtDocument
);

router.delete(
  "/:id",
  verifyAccessToken,
  verifyRole("department_head"),
  verifyPermission("ktDocuments", "delete"),
  deleteKtDocument
);

export default router;
