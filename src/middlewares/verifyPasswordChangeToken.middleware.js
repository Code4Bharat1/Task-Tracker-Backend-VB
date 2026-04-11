import customError from "../utils/error.js";
import { verifyTempPasswordChangeToken } from "../utils/jwt.js";

const verifyPasswordChangeToken = (req, res, next) => {
	try {
		const authHeader = req.headers.authorization;
		if (!authHeader?.startsWith("Bearer ")) {
			throw customError("Missing or invalid authorization header", 401);
		}

		const token = authHeader.split(" ")[1];
		const payload = verifyTempPasswordChangeToken(token);

		req.userId = payload.userId;
		next();
	} catch (error) {
		if (error.name === "TokenExpiredError") {
			return next(customError("Password change token has expired. Please log in again.", 401));
		}
		if (error.message === "Invalid token purpose") {
			return next(customError("Invalid token", 403));
		}
		next(customError("Invalid or expired token", 401));
	}
};

export default verifyPasswordChangeToken;
