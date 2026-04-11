export default function verifyRole(allowRole) {
	// allowRole can be a string (single role), a string with '|' delim, or an array of roles
	const normalize = (r) => {
		if (Array.isArray(r)) return r;
		if (typeof r === "string" && r.includes("|")) return r.split("|").map((s) => s.trim());
		return [r];
	};

	const allowedRoles = normalize(allowRole);

	return (req, res, next) => {
		const role = req.role;
		if (!role) {
			return res.status(401).json({ error: "Invalid or expired token" });
		}
		if (!allowedRoles.includes(role)) {
			console.warn(
				`[verifyRole] access denied. role=${role} allowed=${JSON.stringify(allowedRoles)} path=${req.method} ${req.originalUrl}`
			);
			return res.status(403).json({
				message: "Access Denied",
				error: "You are not authorized to perform this action",
			});
		}
		next();
	};
}
