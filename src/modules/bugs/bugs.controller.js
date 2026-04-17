import {
  createBugService,
  getBugsService,
  getMyBugsService,
  getBugsReportedByMeService,
  getBugByIdService,
  updateBugService,
  deleteBugService,
} from "./bugs.service.js";

export const getMyBugs = async (req, res, next) => {
  try {
    const { companyId, userId } = req;
    const { page, limit } = req.query;
    const result = await getMyBugsService({ companyId, userId, page, limit });
    res.status(200).json({ bugs: result.data, pagination: result.pagination });
  } catch (err) { next(err); }
};

export const getBugsReportedByMe = async (req, res, next) => {
  try {
    const { companyId, userId } = req;
    const { page, limit } = req.query;
    const result = await getBugsReportedByMeService({ companyId, userId, page, limit });
    res.status(200).json({ bugs: result.data, pagination: result.pagination });
  } catch (err) { next(err); }
};

export const createBug = async (req, res, next) => {
  try {
    const { companyId, userId } = req;
    const bug = await createBugService({ companyId, userId, data: req.body });
    res.status(201).json({ bug });
  } catch (err) { next(err); }
};

export const getBugs = async (req, res, next) => {
  try {
    const { companyId, role, departmentId, userId } = req;
    const { projectId, moduleId, status, severity, assignedTo, reportedBy, assignedToMe, reportedByMe, page, limit } = req.query;
    const result = await getBugsService({ companyId, role, departmentId, userId, projectId, moduleId, status, severity, assignedTo, reportedBy, assignedToMe, reportedByMe, requesterId: userId, page, limit });
    res.status(200).json({ bugs: result.data, pagination: result.pagination });
  } catch (err) { next(err); }
};

export const getBugById = async (req, res, next) => {
  try {
    const { companyId } = req;
    const bug = await getBugByIdService({ id: req.params.id, companyId });
    res.status(200).json({ bug });
  } catch (err) { next(err); }
};

export const updateBug = async (req, res, next) => {
  try {
    const { companyId, userId } = req;
    const bug = await updateBugService({ id: req.params.id, companyId, userId, data: req.body });
    res.status(200).json({ bug });
  } catch (err) { next(err); }
};

export const deleteBug = async (req, res, next) => {
  try {
    const { companyId } = req;
    await deleteBugService({ id: req.params.id, companyId });
    res.status(200).json({ message: "Bug deleted successfully" });
  } catch (err) { next(err); }
};
