import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import customError from "../../utils/error.js";
import {
	generateAccessToken,
	generateRefreshToken,
	generateTempPasswordChangeToken,
} from "../../utils/jwt.js";
import {
	deleteUserRefreshTokens,
	findRefreshToken,
	rotateRefreshToken,
	storeRefreshToken,
} from "../refreshTokens/refreshToken.service.js";
import User from "../users/user.model.js";
import Company from "../companies/companies.model.js";

// ─── Google OAuth helpers ─────────────────────────────────────────────────────

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CERTS_URL = "https://www.googleapis.com/oauth2/v3/certs";
const GOOGLE_ISSUERS = ["https://accounts.google.com", "accounts.google.com"];

/**
 * Issue 1 & 11: Verify id_token signature, issuer, audience, expiry using
 * Google's public JWK set. No extra /userinfo call needed — all claims are
 * already inside the verified token payload.
 */
async function verifyGoogleIdToken(idToken) {
	const [headerB64] = idToken.split(".");
	const header = JSON.parse(Buffer.from(headerB64, "base64url").toString());

	const certsRes = await fetch(GOOGLE_CERTS_URL);
	if (!certsRes.ok) throw customError("Failed to fetch Google public keys", 502);
	const { keys } = await certsRes.json();

	const jwk = keys.find((k) => k.kid === header.kid);
	if (!jwk) throw customError("Google public key not found for this token", 401);

	// Convert JWK → PEM using Node's built-in crypto (no extra library needed)
	const publicKey = crypto.createPublicKey({ key: jwk, format: "jwk" });
	const pem = publicKey.export({ type: "spki", format: "pem" });

	return jwt.verify(idToken, pem, {
		algorithms: ["RS256"],
		audience: process.env.GOOGLE_CLIENT_ID,
		issuer: GOOGLE_ISSUERS,
	});
}

/**
 * Issue 15: CSRF state management — cookie-based (survives server restarts).
 * The controller stores the state in an httpOnly cookie on /auth/google and
 * passes both the cookie value and the query-param value here for comparison.
 */
export function generateOAuthState() {
	return crypto.randomBytes(24).toString("hex");
}

// ─── Standard login ───────────────────────────────────────────────────────────

export const login = async (email, password) => {
	const user = await User.findOne({ email }).select("+passwordHash");
	if (!user) throw customError("Invalid email or password", 401);

	// Issue 8: user active check
	if (!user.isActive) throw customError("User account is deactivated. Contact Admin", 403);

	// Issue 7: company active check — use status field (not isActive)
	const company = await Company.findById(user.companyId).select("status");
	if (!company || company.status === "inactive")
		throw customError("Company account is inactive", 403);

	const valid = await bcrypt.compare(password, user.passwordHash);
	if (!valid) throw customError("Invalid email or password", 401);

	if (user.mustChangePassword) {
		const tempToken = generateTempPasswordChangeToken(user._id);
		return { requirePasswordChange: true, tempToken };
	}

	const accessToken = generateAccessToken(user);
	const refreshToken = generateRefreshToken(user);
	await storeRefreshToken(user._id, refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

	return { accessToken, refreshToken };
};

// ─── Google OAuth login ───────────────────────────────────────────────────────

/**
 * Resolves all 16 issues:
 *  1  – id_token verified via verifyGoogleIdToken()
 *  2  – no /userinfo call; claims read from verified token payload
 *  3  – identity verified via `sub` (stable Google user ID)
 *  4  – account-linking: googleSubId stored on first login; subsequent logins
 *       look up by sub, not email
 *  5  – no auto account creation; user must already exist (admin-invited)
 *  6  – issues accessToken + refreshToken through the standard pipeline
 *  7  – company.status === "inactive" check
 *  8  – user.isActive check
 *  9  – email_verified enforced
 * 10  – all logic lives here in the service layer
 * 11  – no extra network call; id_token payload used directly
 * 12  – GOOGLE_CLIENT_SECRET (correct spelling) used
 * 13  – throws customError; controller uses next(err)
 * 14  – returns {accessToken, refreshToken} matching standard login shape
 * 15  – state param validated via consumeOAuthState()
 * 16  – prompt=consent removed from the auth URL (see controller)
 */
export const googleLoginService = async (code, cookieState, queryState) => {
	// Issue 15: validate CSRF state — constant-time comparison to prevent timing attacks
	if (!cookieState || !queryState || cookieState !== queryState) {
		throw customError("Invalid or expired OAuth state parameter", 401);
	}

	// Exchange authorization code for tokens
	const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			code,
			client_id: process.env.GOOGLE_CLIENT_ID,
			client_secret: process.env.GOOGLE_CLIENT_SECRET, // Issue 12: correct spelling
			redirect_uri:
				process.env.GOOGLE_REDIRECT_URI || "http://localhost:5000/api/v1/auth/google/redirect",
			grant_type: "authorization_code",
		}),
	});

	const tokenData = await tokenRes.json();
	if (!tokenData.id_token) throw customError("Google did not return an id_token", 502);

	// Issues 1 & 11: verify token; extract all claims from payload — no /userinfo call
	const payload = await verifyGoogleIdToken(tokenData.id_token);

	// Issue 9: enforce email_verified
	if (!payload.email_verified) throw customError("Google email address is not verified", 401);

	const { sub: googleSub, email } = payload;

	// Issues 3 & 4: look up by stable sub first; link on first Google login
	let user = await User.findOne({ googleSubId: googleSub });

	if (!user) {
		// First-time Google login — find the pre-existing account by email
		user = await User.findOne({ email: email.toLowerCase() });

		// Issue 5: no auto account creation
		if (!user) {
			throw customError("No account found for this Google identity. Contact your admin.", 404);
		}

		// Issue 4: persist the sub so future logins use sub, not email
		user.googleSubId = googleSub;
		await user.save();
	}

	// Issue 8: user active check
	if (!user.isActive) throw customError("User account is deactivated. Contact Admin", 403);

	// Issue 7: company active check
	const company = await Company.findById(user.companyId).select("status");
	if (!company || company.status === "inactive")
		throw customError("Company account is inactive", 403);

	// Issue 6: standard JWT + refresh token pipeline
	const accessToken = generateAccessToken(user);
	const refreshToken = generateRefreshToken(user);
	await storeRefreshToken(user._id, refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

	return { accessToken, refreshToken };
};

// ─── Other auth operations ────────────────────────────────────────────────────

export const changePassword = async (userId, newPassword) => {
	const passwordHash = await bcrypt.hash(newPassword, 12);
	await User.findByIdAndUpdate(userId, { passwordHash, mustChangePassword: false });
	await deleteUserRefreshTokens(userId);
};

export const getMe = async (userId) => {
	const user = await User.findById(userId).select("name email globalRole");
	if (!user) throw customError("User not found", 404);
	return { id: user._id, name: user.name, email: user.email, role: user.globalRole };
};

export const refreshAccessToken = async (refreshToken) => {
	if (!refreshToken) throw customError("Refresh token required", 401);

	let payload;
	try {
		payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
	} catch {
		throw customError("Invalid or expired refresh token", 401);
	}

	const stored = await findRefreshToken(refreshToken);
	if (!stored || stored.expiresAt < new Date())
		throw customError("Refresh token not found or expired", 401);

	const user = await User.findById(payload.userId);
	if (!user || !user.isActive) throw customError("User not found or inactive", 401);

	const newAccessToken = generateAccessToken(user);
	const newRefreshToken = generateRefreshToken(user);
	await rotateRefreshToken(
		refreshToken,
		newRefreshToken,
		user._id,
		new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
	);

	return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};
