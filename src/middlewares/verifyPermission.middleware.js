import Company from "../modules/companies/companies.model.js";

/**
 * verifyPermission(resource, action)
 * Checks company.rolePermissions for the requesting user's role.
 * Admin and super_admin always pass.
 * Lead uses department_head permissions (lead = elevated employee).
 * For department_head and employee, checks the stored permission matrix.
 */
export default function verifyPermission(resource, action) {
	return async (req, res, next) => {
		try {
			const role = req.role;

			// Admin, super_admin, and lead always have full access
			if (role === "admin" || role === "super_admin" || role === "lead") return next();

			const company = await Company.findById(req.companyId).select("rolePermissions").lean();

			// If no permissions configured, fall back to allowing access
			if (!company?.rolePermissions) return next();

			const rolePerms = company.rolePermissions[role];

			if (!rolePerms) {
				return res.status(403).json({
					error: "Access Denied",
					message: `Role '${role}' has no configured permissions`,
				});
			}

			const resourcePerms = rolePerms[resource];

			if (!resourcePerms) {
				return res.status(403).json({
					error: "Access Denied",
					message: `No permissions configured for '${resource}'`,
				});
			}

			if (!resourcePerms[action]) {
				return res.status(403).json({
					error: "Access Denied",
					message: `You do not have '${action}' permission on '${resource}'`,
				});
			}

			next();
		} catch (err) {
			next(err);
		}
	};
}
