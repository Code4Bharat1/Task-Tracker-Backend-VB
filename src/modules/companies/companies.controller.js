import {
	deleteCompany,
	getCompanies,
	getCompanyById,
	registerCompanyAndAdmin,
	updateCompany,
} from "./companies.service.js";

export const registerCompanyController = async (req, res, next) => {
	try {
		const { companyName, name, email } = req.body;
		if (!companyName || !name || !email) {
			return res.status(400).json({ error: "All fields are required" });
		}
		const result = await registerCompanyAndAdmin(companyName, name, email);
		res.status(201).json({
			message: "Company and admin registered successfully",
			company: result.company,
			admin: result.admin,
		});
	} catch (error) {
		next(error);
	}
};

export const getCompaniesController = async (req, res, next) => {
	try {
		const { page, limit } = req.query;
		const result = await getCompanies(page, limit);
		res.status(200).json({ message: "Companies fetched successfully", ...result });
	} catch (error) {
		next(error);
	}
};

export const getCompanyByIdController = async (req, res, next) => {
	try {
		const { id } = req.params;
		const company = await getCompanyById(id);
		res.status(200).json({ company });
	} catch (error) {
		next(error);
	}
};

export const updateCompanyController = async (req, res, next) => {
	try {
		const { companyId } = req.params;
		const result = await updateCompany(companyId, req.body);
		res.status(200).json({ message: "Company updated successfully", company: result });
	} catch (error) {
		next(error);
	}
};

export const deleteCompanyController = async (req, res, next) => {
	try {
		const { companyId } = req.params;
		if (!companyId) {
			return res.status(400).json({ error: "Company ID is required" });
		}
		await deleteCompany(companyId);
		res.status(200).json({ message: "Company deleted successfully" });
	} catch (error) {
		next(error);
	}
};

export const getRolePermissionsController = async (req, res, next) => {
	try {
		const company = await getCompanyById(req.companyId);
		if (!company) return res.status(404).json({ error: "Company not found" });
		res.status(200).json({ rolePermissions: company.rolePermissions ?? {} });
	} catch (error) {
		next(error);
	}
};

export const updateRolePermissionsController = async (req, res, next) => {
	try {
		const { rolePermissions } = req.body;
		if (!rolePermissions) return res.status(400).json({ error: "rolePermissions is required" });
		const company = await updateCompany(req.companyId, { rolePermissions });
		res.status(200).json({ message: "Permissions updated", rolePermissions: company.rolePermissions });
	} catch (error) {
		next(error);
	}
};
