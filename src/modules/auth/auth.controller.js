import customError from "../../utils/error.js";
import {
	changePassword,
	getMe,
	googleLoginService,
	generateOAuthState,
	login,
	refreshAccessToken,
} from "./auth.service.js";
import User from "../users/user.model.js";
import { sendEmail } from "../../utils/sendEmail.js";
import { generateTempPasswordChangeToken } from "../../utils/jwt.js";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const REDIRECT_URI =
	process.env.GOOGLE_REDIRECT_URI || "http://localhost:5000/api/v1/auth/google/redirect";

const refreshCookieOptions = {
	httpOnly: true,
	secure: process.env.NODE_ENV === "production",
	sameSite: "lax",
	maxAge: 7 * 24 * 60 * 60 * 1000,
	path: "/",
};

// ─── Standard auth ────────────────────────────────────────────────────────────

export const loginController = async (req, res, next) => {
	try {
		const { email, password } = req.body;
		if (!email || !password) throw customError("Email and password are required", 400);

		const result = await login(email, password);

		if (result.requirePasswordChange) {
			return res.status(200).json({
				requirePasswordChange: true,
				tempToken: result.tempToken,
				message: "Password change required before proceeding",
			});
		}

		res.cookie("refreshToken", result.refreshToken, refreshCookieOptions);
		res
			.status(200)
			.json({ success: true, accessToken: result.accessToken, message: "Login successful" });
	} catch (error) {
		next(error);
	}
};

export const changePasswordController = async (req, res, next) => {
	try {
		const { newPassword } = req.body;
		if (!newPassword) throw customError("newPassword is required", 400);
		await changePassword(req.userId, newPassword);
		res.status(200).json({ message: "Password changed successfully. Please log in again." });
	} catch (error) {
		next(error);
	}
};

export const getMeController = async (req, res, next) => {
	try {
		const user = await getMe(req.userId);
		res.status(200).json({ success: true, user });
	} catch (error) {
		next(error);
	}
};

export const refreshController = async (req, res, next) => {
	try {
		const refreshToken = req.cookies?.refreshToken;
		const { accessToken, refreshToken: newRefreshToken } = await refreshAccessToken(refreshToken);
		res.cookie("refreshToken", newRefreshToken, refreshCookieOptions);
		res.status(200).json({ success: true, accessToken });
	} catch (error) {
		next(error);
	}
};

export const forgotPasswordController = async (req, res, next) => {
	try {
		const { email } = req.body;
		if (!email) throw customError("Email is required", 400);

		const user = await User.findOne({ email: email.toLowerCase() });
		if (user) {
			const tempToken = generateTempPasswordChangeToken(user._id);
			const frontend = process.env.FRONTEND_URL || "http://localhost:3000";
			const resetLink = `${frontend}/auth/change-password?token=${tempToken}`;
			const html = `<p>We received a request to reset your password. Click the link below to set a new password (link expires in 10 minutes):</p><p><a href="${resetLink}">Reset password</a></p>`;
			try {
				await sendEmail(user.email, "Reset your Task Tracker password", html);
			} catch (e) {
				console.error("Failed to send reset email:", e?.message || e);
			}
		}

		// Always return success to prevent account enumeration
		res.status(200).json({
			message:
				"If an account with that email exists, an email has been sent with password reset instructions.",
		});
	} catch (error) {
		next(error);
	}
};

const oauthStateCookieOptions = {
	httpOnly: true,
	secure: process.env.NODE_ENV === "production",
	sameSite: "lax",
	maxAge: 10 * 60 * 1000, // 10 minutes — long enough to complete the OAuth flow
	path: "/",
};

// ─── Google OAuth ─────────────────────────────────────────────────────────────

export const googleAuth = (req, res) => {
	const state = generateOAuthState();

	// Store state in a cookie so validation survives server restarts
	res.cookie("oauth_state", state, oauthStateCookieOptions);

	const url =
		"https://accounts.google.com/o/oauth2/v2/auth?" +
		new URLSearchParams({
			client_id: CLIENT_ID,
			redirect_uri: REDIRECT_URI,
			response_type: "code",
			scope: "openid email profile",
			access_type: "offline",
			state,
		});

	res.redirect(url);
};

export const googleRedirect = async (req, res, next) => {
	const frontend = process.env.FRONTEND_URL || "http://localhost:3000";

	try {
		const { code, state: queryState } = req.query;
		const cookieState = req.cookies?.oauth_state;

		// Always clear the state cookie regardless of outcome (one-time use)
		res.clearCookie("oauth_state", { path: "/" });

		if (!code) throw customError("Authorization code missing", 400);

		const { accessToken, refreshToken } = await googleLoginService(code, cookieState, queryState);

		res.cookie("refreshToken", refreshToken, refreshCookieOptions);
		res.redirect(`${frontend}/auth/callback#token=${accessToken}`);
	} catch (error) {
		const message = encodeURIComponent(error.message || "Google login failed");
		res.redirect(`${frontend}/login?error=${message}`);
	}
};
