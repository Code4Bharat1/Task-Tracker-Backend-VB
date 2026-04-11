import mongoose from "mongoose";
import ModuleAssignment from "./moduleAssignment.model.js";

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

export const assignModuleService = async ({ companyId, userId, data }) => {
  const { moduleId, projectId, assigneeId, role } = data;
  if (!moduleId || !projectId || !assigneeId || !role) {
    throw Object.assign(new Error("moduleId, projectId, assigneeId and role are required"), { statusCode: 400 });
  }
  // upsert — update role if already assigned
  return ModuleAssignment.findOneAndUpdate(
    { companyId, moduleId, userId: assigneeId },
    { companyId, moduleId, projectId, userId: assigneeId, role, assignedBy: userId },
    { upsert: true, new: true, runValidators: true }
  );
};

export const getModuleAssignmentsService = async ({ companyId, moduleId, projectId, userId: filterUserId, page = 1, limit = 20 }) => {
  page = Math.max(1, Number(page) || 1);
  limit = Math.min(100, Number(limit) || 20);
  const skip = (page - 1) * limit;

  const query = { companyId };
  if (moduleId) query.moduleId = moduleId;
  if (projectId) query.projectId = projectId;
  if (filterUserId) query.userId = filterUserId;

  const [data, total] = await Promise.all([
    ModuleAssignment.find(query).select("-__v").skip(skip).limit(limit).sort({ created_at: -1 }),
    ModuleAssignment.countDocuments(query),
  ]);

  return { data, pagination: { total, page, pages: Math.ceil(total / limit), limit } };
};

export const removeModuleAssignmentService = async ({ id, companyId }) => {
  if (!isValidId(id)) throw Object.assign(new Error("Invalid assignment ID"), { statusCode: 400 });
  const assignment = await ModuleAssignment.findOneAndDelete({ _id: id, companyId });
  if (!assignment) throw Object.assign(new Error("Assignment not found"), { statusCode: 404 });
  return true;
};
