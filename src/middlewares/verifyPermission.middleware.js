import Company from "../modules/companies/companies.model.js";

// ─── In-memory permission cache (TTL: 60 seconds) ─────────────────────────────
// Avoids a DB round-trip to Atlas on every permissioned request.
const permCache = new Map(); // key: companyId → { perms, expiresAt }
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

async function getCompanyPermissions(companyId) {
	const now = Date.now();
	const cached = permCache.get(companyId);
	if (cached && cached.expiresAt > now) {
		return cached.perms;
	}
	const company = await Company.findById(companyId).select("rolePermissions").lean();
	const perms = company?.rolePermissions ?? null;
	permCache.set(companyId, { perms, expiresAt: now + CACHE_TTL_MS });
	return perms;
}

// Allow external code to invalidate the cache when permissions are updated
export function invalidatePermissionCache(companyId) {
	if (companyId) permCache.delete(companyId);
	else permCache.clear();
}

/**
 * verifyPermission(resource, action)
 * Checks company.rolePermissions for the requesting user's role.
 * Admin and super_admin always pass.
 * Uses a 60-second in-memory cache to avoid repeated Atlas round-trips.
 */
export default function verifyPermission(resource, action) {
	return async (req, res, next) => {
		try {
			const role = req.role;

			// Admin and super_admin always have full access
			if (role === "admin" || role === "super_admin") return next();

			const rolePermissions = await getCompanyPermissions(req.companyId);

			// If no permissions configured at all, fall back to allowing access
			if (!rolePermissions) return next();

			// Map role to the correct key in rolePermissions
			let roleKey;
			if (role === "department_head") roleKey = "department_head";
			else if (role === "lead") roleKey = "lead";
			else roleKey = "employee";

			const rolePerms = rolePermissions[roleKey];

			// If this role has no saved permissions yet, fall back to allowing access
			if (!rolePerms || Object.keys(rolePerms).length === 0) return next();

			const resourcePerms = rolePerms[resource];

			// If this resource has no saved permissions yet, fall back to allowing access
			if (!resourcePerms || Object.keys(resourcePerms).length === 0) return next();

			// If the specific action permission is not set, fall back to allowing access
			if (resourcePerms[action] === undefined) return next();

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
