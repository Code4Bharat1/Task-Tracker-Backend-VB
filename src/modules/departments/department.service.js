import Department from "./departments.model.js";
import { createUserAccount } from "../users/user.service.js";
import mongoose from "mongoose";
import User from "../users/user.model.js";

export const createNewDepartmentAndDepartmentHead = async (
	departmentName,
	name,
	email,
	globalRole = "department_head",
	companyId
) => {
	// Create department first
	const department = await Department.create({ companyId, departmentName });

	// Create the department head user (email sent fire-and-forget inside createUserAccount)
	const user = await createUserAccount({
		name,
		email,
		globalRole,
		departmentId: department._id,
		companyId,
	});

	return { departments: department, user };
};

export const getAllDepartments = async (companyId, role, page = 1, limit = 10) => {
	page = Math.max(1, Number(page) || 1);
	limit = Math.min(50, Number(limit) || 10);
	const companyObjId = new mongoose.Types.ObjectId(String(companyId));

	const departments = await Department.aggregate([
		{ $match: { companyId: companyObjId } },
		{
			$lookup: {
				from: "users",
				let: { deptId: "$_id" },
				pipeline: [
					{
						$match: {
							$expr: {
								$and: [
									{ $eq: ["$departmentId", "$$deptId"] },
									{ $eq: ["$companyId", companyObjId] },
								],
							},
						},
					},
					{ $count: "count" },
				],
				as: "_memberCount",
			},
		},
		{
			$addFields: {
				employeeCount: {
					$ifNull: [{ $arrayElemAt: ["$_memberCount.count", 0] }, 0],
				},
			},
		},
		{ $project: { _memberCount: 0, __v: 0 } },
		{ $sort: { created_at: -1 } },
		{ $skip: (page - 1) * limit },
		{ $limit: limit },
	]);

	return departments;
};

export const geetOneDepartment = async (companyId, departmentId) => {
	const department = await Department.findOne({ companyId, _id: departmentId }).select({
		_v: 0,
	});
	if (!department) return { error: "No department found" };
	return department;
};

export const getAllMembersOfDepartment = async (departmentId, companyId) => {
	const users = await User.find({ departmentId, companyId }).select({
		passwordHash: 0,
		googleSubId: 0,
		mustChangePassword: 0,
		_v: 0,
	});
	if (!users) return { error: "No users found" };
	return users;
};
