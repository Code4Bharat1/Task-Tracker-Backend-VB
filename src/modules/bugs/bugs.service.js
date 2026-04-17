import mongoose from "mongoose";
import Bug from "./bugs.model.js";

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const ALLOWED_UPDATE_FIELDS = ["title", "description", "severity", "status", "assignedTo", "stepsToReproduce", "attachmentUrl", "resolvedAt"];

export const createBugService = async ({ companyId, userId, data }) => {
  const { projectId, moduleId, title, description, severity, assignedTo, stepsToReproduce, attachmentUrl } = data;
  if (!projectId) throw Object.assign(new Error("projectId is required"), { statusCode: 400 });
  if (!title) throw Object.assign(new Error("title is required"), { statusCode: 400 });

  return Bug.create({ companyId, projectId, moduleId, title, description, severity, assignedTo, stepsToReproduce, attachmentUrl, reportedBy: userId });
};

export const getBugsService = async ({ companyId, departmentId, role, projectId, moduleId, status, severity, assignedTo, assignedToMe, reportedByMe, requesterId, page = 1, limit = 20 }) => {
  page = Math.max(1, Number(page) || 1);
  limit = Math.min(100, Number(limit) || 20);
  const skip = (page - 1) * limit;

  const query = { companyId };
  if (projectId) {
    query.projectId = projectId;
  } else if (role === "department_head" && departmentId) {
    const Project = (await import("../projects/projects.model.js")).default;
    const deptProjects = await Project.find({ companyId, departmentId }).select("_id").lean();
    query.projectId = { $in: deptProjects.map((p) => p._id) };
  }
  if (moduleId) query.moduleId = moduleId;
  if (status) query.status = status;
  if (severity) query.severity = severity;
  if (assignedTo) query.assignedTo = assignedTo;
  if (assignedToMe === "true" || assignedToMe === true) query.assignedTo = requesterId;
  if (reportedByMe === "true" || reportedByMe === true) query.reportedBy = requesterId;

  const [data, total] = await Promise.all([
    Bug.find(query).select("-__v").skip(skip).limit(limit).sort({ created_at: -1 }),
    Bug.countDocuments(query),
  ]);

  return { data, pagination: { total, page, pages: Math.ceil(total / limit), limit } };
};

export const getMyBugsService = async ({ companyId, userId, page = 1, limit = 20 }) => {
  page = Math.max(1, Number(page) || 1);
  limit = Math.min(100, Number(limit) || 20);
  const skip = (page - 1) * limit;

  const query = { companyId, assignedTo: userId };

  const [data, total] = await Promise.all([
    Bug.find(query).select("-__v").skip(skip).limit(limit).sort({ created_at: -1 }),
    Bug.countDocuments(query),
  ]);

  return { data, pagination: { total, page, pages: Math.ceil(total / limit), limit } };
};

export const getBugsReportedByMeService = async ({ companyId, userId, page = 1, limit = 20 }) => {
  page = Math.max(1, Number(page) || 1);
  limit = Math.min(100, Number(limit) || 20);
  const skip = (page - 1) * limit;

  const query = { companyId, reportedBy: userId };

  const [data, total] = await Promise.all([
    Bug.find(query).select("-__v").skip(skip).limit(limit).sort({ created_at: -1 }),
    Bug.countDocuments(query),
  ]);

  return { data, pagination: { total, page, pages: Math.ceil(total / limit), limit } };
};

export const getBugByIdService = async ({ id, companyId }) => {
  if (!isValidId(id)) throw Object.assign(new Error("Invalid bug ID"), { statusCode: 400 });
  const bug = await Bug.findOne({ _id: id, companyId }).select("-__v");
  if (!bug) throw Object.assign(new Error("Bug not found"), { statusCode: 404 });
  return bug;
};

export const updateBugService = async ({ id, companyId, userId, data }) => {
  if (!isValidId(id)) throw Object.assign(new Error("Invalid bug ID"), { statusCode: 400 });

  const updateData = {};
  for (const key of ALLOWED_UPDATE_FIELDS) {
    if (data[key] !== undefined) updateData[key] = data[key];
  }
  if (!Object.keys(updateData).length) throw Object.assign(new Error("No valid fields to update"), { statusCode: 400 });

  if (updateData.status === "RESOLVED" && !updateData.resolvedAt) updateData.resolvedAt = new Date();

  const bug = await Bug.findOneAndUpdate({ _id: id, companyId }, updateData, { new: true, runValidators: true });
  if (!bug) throw Object.assign(new Error("Bug not found"), { statusCode: 404 });
  return bug;
};

export const deleteBugService = async ({ id, companyId }) => {
  if (!isValidId(id)) throw Object.assign(new Error("Invalid bug ID"), { statusCode: 400 });
  const bug = await Bug.findOneAndDelete({ _id: id, companyId });
  if (!bug) throw Object.assign(new Error("Bug not found"), { statusCode: 404 });
  return true;
};
