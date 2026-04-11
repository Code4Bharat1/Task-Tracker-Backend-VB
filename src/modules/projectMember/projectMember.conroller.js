import ProjectMembersModel from "./projectMember.model.js";

export const createProjectMember = async (req, res, next) => {
  try {
    const { companyId, userId: requesterId } = req;
    const { projectId, userId, role } = req.body;

    if (!projectId || !userId || !role) {
      return res.status(400).json({ error: "projectId, userId and role are required" });
    }

    const data = await ProjectMembersModel.create({
      companyId,
      projectId,
      userId,
      role,
      assignedBy: requesterId,
    });

    res.status(201).json({ message: "Project member added successfully", data });
  } catch (err) { next(err); }
};

export const getAllProjectMembers = async (req, res, next) => {
  try {
    const { companyId } = req;
    const { projectId, userId } = req.query;

    const filter = { companyId };
    if (projectId) filter.projectId = projectId;
    if (userId) filter.userId = userId;

    const data = await ProjectMembersModel.find(filter).sort({ created_at: -1 });
    res.status(200).json({ message: "Members fetched successfully", data });
  } catch (err) { next(err); }
};

export const getSingleProjectMember = async (req, res, next) => {
  try {
    const { companyId } = req;
    const member = await ProjectMembersModel.findOne({ _id: req.params.id, companyId });
    if (!member) return res.status(404).json({ error: "Member not found" });
    res.status(200).json({ message: "Member fetched successfully", data: member });
  } catch (err) { next(err); }
};

export const updateProjectMember = async (req, res, next) => {
  try {
    const { companyId } = req;
    const { role } = req.body;

    const member = await ProjectMembersModel.findOneAndUpdate(
      { _id: req.params.id, companyId },
      { role },
      { new: true, runValidators: true }
    );
    if (!member) return res.status(404).json({ error: "Member not found" });
    res.status(200).json({ message: "Member updated successfully", data: member });
  } catch (err) { next(err); }
};

export const deleteProjectMember = async (req, res, next) => {
  try {
    const { companyId } = req;
    const member = await ProjectMembersModel.findOneAndDelete({ _id: req.params.id, companyId });
    if (!member) return res.status(404).json({ error: "Member not found" });
    res.status(200).json({ message: "Member deleted successfully" });
  } catch (err) { next(err); }
};
