import crypto from "crypto";
import RefreshToken from "./refreshToken.model.js";

//store refresh token in DB with hashed value for security
export const storeRefreshToken = async (userId, refreshToken, expiresAt) => {
	const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

	return RefreshToken.create({
		userId,
		tokenHash,
		expiresAt,
	});
};

//find refresh token in DB by hashed value
export const findRefreshToken = async (refreshToken) => {
	const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

	return RefreshToken.findOne({ tokenHash });
};

//rotate refresh token: delete old token and store new one
export const rotateRefreshToken = async (oldToken, newToken, userId, expiresAt) => {
	const oldHash = crypto.createHash("sha256").update(oldToken).digest("hex");

	const newHash = crypto.createHash("sha256").update(newToken).digest("hex");

	await RefreshToken.deleteOne({ tokenHash: oldHash });

	return RefreshToken.create({
		userId,
		tokenHash: newHash,
		expiresAt,
	});
};

//delete refresh token from DB
export const deleteRefreshToken = async (refreshToken) => {
	const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

	return RefreshToken.deleteOne({ tokenHash });
};

//delete all refresh tokens for a user (e.g. on password change)
export const deleteUserRefreshTokens = async (userId) => {
	return RefreshToken.deleteMany({ userId });
};
