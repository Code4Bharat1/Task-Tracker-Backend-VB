import jwt from "jsonwebtoken";

export const generateTempPasswordChangeToken = (userId) => {
	return jwt.sign(
		{ userId: userId.toString(), purpose: "password_change" },
		process.env.JWT_ACCESS_SECRET,
		{ expiresIn: "10m" }
	);
};

export const verifyTempPasswordChangeToken = (token) => {
	const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
	if (payload.purpose !== "password_change") {
		throw new Error("Invalid token purpose");
	}
	return payload;
};

export const generateAccessToken = (user) => {
	return jwt.sign(
		{
			userId: user._id.toString(),
			companyId: user.companyId?.toString(),
			role: user.globalRole,
			// Saumya added this field
			departmentId: user.departmentId?.toString(),
		},
		process.env.JWT_ACCESS_SECRET,
		{
			expiresIn: process.env.JWT_ACCESS_EXPIRES || "15m",
		}
	);
};

export const generateRefreshToken = (user) => {
	return jwt.sign(
		{
			userId: user._id.toString(),
		},
		process.env.JWT_REFRESH_SECRET,
		{
			expiresIn: process.env.JWT_REFRESH_EXPIRES || "7d",
		}
	);
};
