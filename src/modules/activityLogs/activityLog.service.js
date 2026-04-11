import ActivityLog from "./activityLog.model.js";

export const logActivity = async ({ companyId, userId, action, entity, entityId, meta = {}, ipAddress = "" }) => {
  try {
    return await ActivityLog.create({ companyId, userId, action, entity, entityId, meta, ipAddress });
  } catch {
    // activity logging should never crash the main flow
  }
};

export const getActivityLogsService = async ({ companyId, userId, entity, page = 1, limit = 30 }) => {
  page = Math.max(1, Number(page) || 1);
  limit = Math.min(100, Number(limit) || 30);
  const skip = (page - 1) * limit;

  const query = { companyId };
  if (userId) query.userId = userId;
  if (entity) query.entity = entity;

  const [data, total] = await Promise.all([
    ActivityLog.find(query).select("-__v").skip(skip).limit(limit).sort({ created_at: -1 }),
    ActivityLog.countDocuments(query),
  ]);

  return { data, pagination: { total, page, pages: Math.ceil(total / limit), limit } };
};

export const getActivityLogsByEntityService = async ({ companyId, entity, entityId, page = 1, limit = 30 }) => {
  page = Math.max(1, Number(page) || 1);
  limit = Math.min(100, Number(limit) || 30);
  const skip = (page - 1) * limit;

  const query = { companyId, entity, entityId };

  const [data, total] = await Promise.all([
    ActivityLog.find(query).select("-__v").skip(skip).limit(limit).sort({ created_at: -1 }),
    ActivityLog.countDocuments(query),
  ]);

  return { data, pagination: { total, page, pages: Math.ceil(total / limit), limit } };
};
