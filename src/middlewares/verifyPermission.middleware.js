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

			// Admin and super_admin always have full access
			if (role === "admin" || role === "super_admin") return next();

			const company = await Company.findById(req.companyId).select("rolePermissions").lean();

			// If no permissions configured at all, fall back to allowing access
			if (!company?.rolePermissions) return next();

			// Map role to the correct key in rolePermissions
			let roleKey;
			if (role === "department_head") roleKey = "department_head";
			else if (role === "lead") roleKey = "lead";
			else roleKey = "employee";

			const rolePerms = company.rolePermissions[roleKey];

			// If this role has no saved permissions yet, fall back to allowing access
			if (!rolePerms) return next();

			const resourcePerms = rolePerms[resource];

			// If this resource has no saved permissions yet, fall back to allowing access
			if (!resourcePerms) return next();

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
