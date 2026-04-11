import {
	createUserAccount,
	deleteUserAccount,
	getAllUsersAccounts,
	getUserAccountById,
	getUserAccounts,
	updateUserAccount,
	getColleaguesService,
	uploadProfilePicService,
	getProfilePicService,
	deleteProfilePicService,
} from "./user.service.js";
import customError from "../../utils/error.js";

export const createUser = async (req, res, next) => {
	try {
		const { companyId, departmentId, role: reqRole } = req;
		const { name, email, globalRole, isActive, behaviourScore } = req.body;

		if (!name || !email || !globalRole) {
			return next(customError("name, email and role are required", 400));
		}

		// Role enforcement: department_head can only create employees
		// admin can create department_head or employee
		const allowedRolesByCreator = {
			department_head: ["employee"],
			admin: ["department_head", "employee"],
		};

		if (!allowedRolesByCreator[reqRole]?.includes(globalRole)) {
			return next(customError(`A ${reqRole} cannot create a user with role '${globalRole}'`, 403));
		}

		const user = await createUserAccount({
			name,
			email,
			globalRole,
			departmentId,
			companyId,
			isActive,
			behaviourScore,
		});
		res.status(201).json({ user });
	} catch (error) {
		next(error);
	}
};

export const getUsers = async (req, res, next) => {
	try {
		const { companyId, departmentId, role } = req;
		const { page, limit, search, filterRole } = req.query;

		const result = await getUserAccounts({
			companyId,
			departmentId,
			role,
			page,
			limit,
			search,
			filterRole,
		});
		res.status(200).json(result);
	} catch (error) {
		next(error);
	}
};

export const getUserById = async (req, res, next) => {
	try {
		const { companyId, departmentId } = req;
		const { id } = req.params;

		const user = await getUserAccountById(id, companyId, departmentId);
		if (!user) return next(customError("User not found", 404));

		res.status(200).json({ user });
	} catch (error) {
		next(error);
	}
};

export const updateUser = async (req, res, next) => {
	try {
		const { companyId, departmentId, role: reqRole } = req;
		const { id } = req.params;
		const { name, email, globalRole, departmentId: newDeptId, isActive, behaviourScore } = req.body;

		// department_head can only update employees in their own department
		// admin can update anyone in the company
		const user = await updateUserAccount(
			id,
			companyId,
			reqRole === "department_head" ? departmentId : null,
			{
				name,
				email,
				globalRole,
				departmentId: newDeptId,
				isActive,
				behaviourScore,
			}
		);

		if (!user) return next(customError("User not found or unauthorized", 404));
		res.status(200).json({ user });
	} catch (error) {
		next(error);
	}
};

// Any authenticated user: update their own profile (name only — no role/dept changes)
export const updateMe = async (req, res, next) => {
	try {
		const { userId, companyId } = req;
		const { name } = req.body;
		const user = await updateUserAccount(userId, companyId, null, { name });
		if (!user) return next(customError("User not found", 404));
		res.status(200).json({ user });
	} catch (error) {
		next(error);
	}
};

export const deleteUser = async (req, res, next) => {
	try {
		const { companyId, departmentId, role: reqRole } = req;
		const { id } = req.params;

		const deleted = await deleteUserAccount(
			id,
			companyId,
			reqRole === "department_head" ? departmentId : null
		);
		if (!deleted) return next(customError("User not found or unauthorized", 404));

		res.status(200).json({ message: "User deleted" });
	} catch (error) {
		next(error);
	}
};

// Any authenticated user: read-only list of company colleagues (name, email, role)
export const getColleagues = async (req, res, next) => {
	try {
		const { companyId } = req;
		const result = await getColleaguesService({ companyId });
		res.status(200).json(result);
	} catch (error) {
		next(error);
	}
};

// super_admin only
export const getAllUsers = async (req, res, next) => {
	try {
		const { page, limit } = req.query;
		const users = await getAllUsersAccounts(page, limit);
		res.status(200).json(users);
	} catch (error) {
		next(error);
	}
};

// ─── Profile pic handlers ─────────────────────────────────────────────────────
// TO-DO
/*
export const uploadProfilePic = async (req, res, next) => {
	try {
		if (!req.file) return next(customError("Image file is required", 400));
		const { companyId } = req;
		const { id } = req.params;
		const user = await uploadProfilePicService({ userId: id, companyId, file: req.file });
		res.status(200).json({ user });
	} catch (error) {
		next(error);
	}
};

export const getProfilePic = async (req, res, next) => {
	try {
		const { companyId } = req;
		const { id } = req.params;
		const profilePic = await getProfilePicService({ userId: id, companyId });
		res.status(200).json({ profilePic });
	} catch (error) {
		next(error);
	}
};

export const deleteProfilePic = async (req, res, next) => {
	try {
		const { companyId } = req;
		const { id } = req.params;
		const user = await deleteProfilePicService({ userId: id, companyId });
		res.status(200).json({ user });
	} catch (error) {
		next(error);
	}
};
*/