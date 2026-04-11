import mongoose from "mongoose";
import { Readable } from "stream";
import cloudinary from "../../config/cloudinary.js";
import KtDocument from "./ktDocument.model.js";

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const ALLOWED_UPDATE_FIELDS = ["title", "content", "tags", "visibility", "moduleId"];

// ─── Cloudinary helpers ───────────────────────────────────────────────────────

/**
 * Upload a buffer to Cloudinary as a raw file (preserves original format).
 * Returns { secure_url, public_id, bytes }.
 */
function uploadToCloudinary(buffer, originalName, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "raw",          // required for non-image files
        public_id: originalName,       // keep original filename
        use_filename: true,
        unique_filename: true,
        overwrite: false,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    Readable.from(buffer).pipe(stream);
  });
}

/**
 * Delete a file from Cloudinary by its public_id.
 * Silently ignores errors so a missing file never blocks a DB delete.
 */
async function deleteFromCloudinary(publicId) {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
  } catch {
    // non-fatal — log in production if needed
  }
}

// ─── Service functions ────────────────────────────────────────────────────────

export const createKtDocumentService = async ({ companyId, userId, data, file }) => {
  const { projectId, moduleId, title, content, tags, visibility } = data;

  if (!projectId) throw Object.assign(new Error("projectId is required"), { statusCode: 400 });
  if (!title) throw Object.assign(new Error("title is required"), { statusCode: 400 });

  let fileUrl = null;
  let filePublicId = null;
  let fileType = null;
  let fileSize = null;

  if (file) {
    const folder = `kt-documents/${companyId}/${projectId}`;
    const result = await uploadToCloudinary(file.buffer, file.originalname, folder);
    fileUrl = result.secure_url;
    filePublicId = result.public_id;
    fileType = file.originalname.split(".").pop().toLowerCase();
    fileSize = result.bytes;
  }

  return KtDocument.create({
    companyId,
    projectId,
    moduleId,
    title,
    content,
    fileUrl,
    filePublicId,
    fileType,
    fileSize,
    tags: tags ? (Array.isArray(tags) ? tags : [tags]) : [],
    visibility,
    created_by: userId,
  });
};

export const getKtDocumentsService = async ({ companyId, projectId, moduleId, page = 1, limit = 20 }) => {
  page = Math.max(1, Number(page) || 1);
  limit = Math.min(100, Number(limit) || 20);
  const skip = (page - 1) * limit;

  const query = { companyId };
  if (projectId) query.projectId = projectId;
  if (moduleId) query.moduleId = moduleId;

  const [data, total] = await Promise.all([
    KtDocument.find(query).select("-__v").skip(skip).limit(limit).sort({ created_at: -1 }),
    KtDocument.countDocuments(query),
  ]);

  return { data, pagination: { total, page, pages: Math.ceil(total / limit), limit } };
};

export const getKtDocumentByIdService = async ({ id, companyId }) => {
  if (!isValidId(id)) throw Object.assign(new Error("Invalid document ID"), { statusCode: 400 });
  const doc = await KtDocument.findOne({ _id: id, companyId }).select("-__v");
  if (!doc) throw Object.assign(new Error("KT document not found"), { statusCode: 404 });
  return doc;
};

export const updateKtDocumentService = async ({ id, companyId, userId, data, file }) => {
  if (!isValidId(id)) throw Object.assign(new Error("Invalid document ID"), { statusCode: 400 });

  const doc = await KtDocument.findOne({ _id: id, companyId });
  if (!doc) throw Object.assign(new Error("KT document not found"), { statusCode: 404 });

  const updateData = {};
  for (const key of ALLOWED_UPDATE_FIELDS) {
    if (data[key] !== undefined) updateData[key] = data[key];
  }

  // Replace file if a new one was uploaded
  if (file) {
    // Delete old file from Cloudinary first
    if (doc.filePublicId) await deleteFromCloudinary(doc.filePublicId);

    const folder = `kt-documents/${companyId}/${doc.projectId}`;
    const result = await uploadToCloudinary(file.buffer, file.originalname, folder);
    updateData.fileUrl = result.secure_url;
    updateData.filePublicId = result.public_id;
    updateData.fileType = file.originalname.split(".").pop().toLowerCase();
    updateData.fileSize = result.bytes;
  }

  if (!Object.keys(updateData).length) {
    throw Object.assign(new Error("No valid fields to update"), { statusCode: 400 });
  }

  updateData.updated_by = userId;

  return KtDocument.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
};

export const deleteKtDocumentService = async ({ id, companyId }) => {
  if (!isValidId(id)) throw Object.assign(new Error("Invalid document ID"), { statusCode: 400 });

  const doc = await KtDocument.findOneAndDelete({ _id: id, companyId });
  if (!doc) throw Object.assign(new Error("KT document not found"), { statusCode: 404 });

  // Remove file from Cloudinary
  if (doc.filePublicId) await deleteFromCloudinary(doc.filePublicId);

  return true;
};
