import { getActivityLogsService, getActivityLogsByEntityService } from "./activityLog.service.js";

export const getActivityLogs = async (req, res, next) => {
  try {
    const { companyId } = req;
    const { userId, entity, page, limit } = req.query;
    const result = await getActivityLogsService({ companyId, userId, entity, page, limit });
    res.status(200).json(result);
  } catch (err) { next(err); }
};

export const getActivityLogsByEntity = async (req, res, next) => {
  try {
    const { companyId } = req;
    const { entity, entityId } = req.params;
    const { page, limit } = req.query;
    const result = await getActivityLogsByEntityService({ companyId, entity, entityId, page, limit });
    res.status(200).json(result);
  } catch (err) { next(err); }
};
