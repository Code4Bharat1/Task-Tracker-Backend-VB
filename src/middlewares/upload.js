import multer from "multer";
import customError from "../utils/error.js";

// Generic in-memory storage (used by other routes)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ─── KT Document upload ───────────────────────────────────────────────────────
// Accepts only .pdf and .docx, max 10 MB

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const ALLOWED_EXTENSIONS = new Set([".pdf", ".docx"]);

const documentFileFilter = (req, file, cb) => {
  const ext = "." + file.originalname.split(".").pop().toLowerCase();

  if (!ALLOWED_MIME_TYPES.has(file.mimetype) || !ALLOWED_EXTENSIONS.has(ext)) {
    return cb(customError("Only .pdf and .docx files are allowed", 400), false);
  }
  cb(null, true);
};

export const uploadDocument = multer({
  storage: multer.memoryStorage(),
  fileFilter: documentFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
}).single("file");

// ─── Profile picture upload ───────────────────────────────────────────────────
const ALLOWED_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const imageFileFilter = (req, file, cb) => {
  if (!ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
    return cb(customError("Only .jpg, .png, and .webp images are allowed", 400), false);
  }
  cb(null, true);
};

export const uploadProfilePic = multer({
  storage: multer.memoryStorage(),
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
}).single("profilePic");

// ─── Task attachment upload ───────────────────────────────────
// Accepts images, PDFs, and documents — max 10 MB
const ALLOWED_TASK_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const taskFileFilter = (req, file, cb) => {
  if (!ALLOWED_TASK_MIME_TYPES.has(file.mimetype)) {
    return cb(customError("Only images, PDF, and DOCX files are allowed", 400), false);
  }
  cb(null, true);
};

export const uploadTaskFile = multer({
  storage: multer.memoryStorage(),
  fileFilter: taskFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
}).single("file");

export default upload;
