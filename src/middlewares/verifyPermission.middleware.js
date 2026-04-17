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
			if (!company?.rolePermissions) {
				console.log(`[Permissions] No rolePermissions found for company ${req.companyId}, allowing access`);
				return next();
			}

			// Map role to the correct key in rolePermissions
			// Lead uses department_head permissions (lead = elevated employee)
			let roleKey;
			if (role === "department_head" || role === "lead") roleKey = "department_head";
			else roleKey = "employee";

			const rolePerms = company.rolePermissions[roleKey];

			// If this role has no saved permissions yet, fall back to allowing access
			if (!rolePerms || Object.keys(rolePerms).length === 0) {
				console.log(`[Permissions] No permissions found for role ${roleKey}, allowing access`);
				return next();
			}

			const resourcePerms = rolePerms[resource];

			// If this resource has no saved permissions yet, fall back to allowing access
			if (!resourcePerms || Object.keys(resourcePerms).length === 0) {
				console.log(`[Permissions] No permissions found for resource ${resource}, allowing access`);
				return next();
			}

			// If the specific action permission is not set, fall back to allowing access
			if (resourcePerms[action] === undefined) {
				console.log(`[Permissions] Permission ${action} on ${resource} not set for ${roleKey}, allowing access`);
				return next();
			}

			console.log(`[Permissions] Checking ${roleKey}.${resource}.${action} = ${resourcePerms[action]}`);

			if (!resourcePerms[action]) {
				console.log(`[Permissions] DENIED: ${roleKey} does not have ${action} permission on ${resource}`);
				return res.status(403).json({
					error: "Access Denied",
					message: `You do not have '${action}' permission on '${resource}'`,
				});
			}

			console.log(`[Permissions] ALLOWED: ${roleKey} has ${action} permission on ${resource}`);
			next();
		} catch (err) {
			next(err);
		}
	};
}
