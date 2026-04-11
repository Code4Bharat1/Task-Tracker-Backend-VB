import {
  assignModuleService,
  getModuleAssignmentsService,
  removeModuleAssignmentService,
} from "./moduleAssignment.service.js";

export const assignModule = async (req, res, next) => {
  try {
    const { companyId, userId } = req;
    const assignment = await assignModuleService({ companyId, userId, data: req.body });
    res.status(201).json({ assignment });
  } catch (err) { next(err); }
};

export const getModuleAssignments = async (req, res, next) => {
  try {
    const { companyId } = req;
    const { moduleId, projectId, userId, page, limit } = req.query;
    const result = await getModuleAssignmentsService({ companyId, moduleId, projectId, userId, page, limit });
    res.status(200).json(result);
  } catch (err) { next(err); }
};

export const removeModuleAssignment = async (req, res, next) => {
  try {
    const { companyId } = req;
    await removeModuleAssignmentService({ id: req.params.id, companyId });
    res.status(200).json({ message: "Assignment removed successfully" });
  } catch (err) { next(err); }
};
