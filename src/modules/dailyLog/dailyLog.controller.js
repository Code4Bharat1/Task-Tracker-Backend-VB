import {
  createDailyLogService,
  getDailyLogsService,
  getDailyLogByIdService,
  updateDailyLogService,
  deleteDailyLogService,
  uploadEntryScreenshotService,
} from "./dailyLog.service.js";

export const createDailyLog = async (req, res, next) => {
  try {
    const { companyId, userId } = req;
    const log = await createDailyLogService({ companyId, userId, data: req.body });
    res.status(201).json({ log });
  } catch (err) { next(err); }
};

export const getDailyLogs = async (req, res, next) => {
  try {
    const { companyId, userId: requesterId, role } = req;
    const { userId, projectId, page, limit } = req.query;
    const result = await getDailyLogsService({ companyId, userId, projectId, role, requesterId, page, limit });
    res.status(200).json(result);
  } catch (err) { next(err); }
};

export const getDailyLogById = async (req, res, next) => {
  try {
    const { companyId, userId: requesterId, role } = req;
    const log = await getDailyLogByIdService({ id: req.params.id, companyId, role, requesterId });
    res.status(200).json({ log });
  } catch (err) { next(err); }
};

export const updateDailyLog = async (req, res, next) => {
  try {
    const { companyId, userId: requesterId, role } = req;
    const log = await updateDailyLogService({ id: req.params.id, companyId, role, requesterId, data: req.body });
    res.status(200).json({ log });
  } catch (err) { next(err); }
};

export const deleteDailyLog = async (req, res, next) => {
  try {
    const { companyId, userId: requesterId, role } = req;
    await deleteDailyLogService({ id: req.params.id, companyId, role, requesterId });
    res.status(200).json({ message: "Daily log deleted successfully" });
  } catch (err) { next(err); }
};

export const uploadEntryScreenshot = async (req, res, next) => {
  try {
    const { companyId, userId: requesterId, role } = req;
    if (!req.file) return next(Object.assign(new Error("Image file is required"), { statusCode: 400 }));
    const log = await uploadEntryScreenshotService({
      id: req.params.id,
      entryId: req.params.entryId,
      companyId,
      role,
      requesterId,
      file: req.file,
    });
    res.status(200).json({ log });
  } catch (err) { next(err); }
};
