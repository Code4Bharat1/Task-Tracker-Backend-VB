import Department from "./departments.model.js";
import { createNewDepartmentAndDepartmentHead, geetOneDepartment, getAllDepartments, getAllMembersOfDepartment } from "./department.service.js";

export const createDepartment = async (req, res) => {
	const { departmentName, name: userName, email: userEmail } = req.body;
	if (!departmentName) return res.status(400).json({ error: "Department name is required" });
	if (!userName || !userEmail) return res.status(400).json({ error: "Name and email are required" });

	const companyId = req.companyId;
	if (!companyId) return res.status(400).json({ error: "Missing company context (are you authenticated?)" });
	try {

		// Create the department
		const departmentData = await createNewDepartmentAndDepartmentHead(departmentName, userName, userEmail, undefined, companyId);

		res.status(201).json(departmentData);
	} catch (err) {
		res.status(400).json({ error: err.message });
	}
};

// GET ALL DEPARTMENTS OF A COMPANY
export const getDepartments = async (req, res) => {
	const { companyId, role } = req;
	const { page, limit } = req.query;
	try {
		const allDepartments = await getAllDepartments(companyId, role, page, limit);
		if (allDepartments.error) return res.status(400).json({ error: allDepartments.error });
		return res.status(200).json({ allDepartments });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

// GET ONE DEPARTMENT OF A COMPANY
export const getDepartmentById = async (req, res) => {
	const companyId = req.companyId;
	const id = req.params.id;
	try {
		const department = await geetOneDepartment(companyId, id);
		if (department.error) return res.status(400).json({ error: department.error });
		return res.status(200).json({ department });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

// GET MEMBERS OF A DEPARTMENT
export const getDepartmentMembers = async (req, res) => {
	const { companyId } = req;
	const departmentId = req.params.id;
	try {
		const members = await getAllMembersOfDepartment(departmentId, companyId);
		if (members.error) return res.status(400).json({ error: members.error });
		return res.status(200).json({ members });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

// UPDATE DEPARTMENT
export const updateDepartment = async (req, res) => {
	const companyId = req.companyId;
	const id = req.params.id;
	const data = req.body;
	try {
		const dept = await Department.findById(id);
		if (!dept) return res.status(404).json({ error: "Department not found" });

		if (dept.companyId.toString() !== companyId.toString())
			return res.status(403).json({
				error: "You are not authorized to access this department",
			});

		const department = await Department.findByIdAndUpdate(id, data, {
			new: true,
			runValidators: true,
		});
		return res.status(200).json({ department });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};
// DELETE
export const deleteDepartment = async (req, res) => {
	const companyId = req.companyId;
	const id = req.params.id;
	try {
		const dept = await Department.findById(id);
		if (!dept) return res.status(404).json({ error: "Department not found" });

		if (dept.companyId.toString() !== companyId.toString())
			return res.status(403).json({
				error: "You are not authorized to access this department",
			});

		await Department.findByIdAndDelete(id);
		return res.status(200).json({ message: "Department deleted" });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};
