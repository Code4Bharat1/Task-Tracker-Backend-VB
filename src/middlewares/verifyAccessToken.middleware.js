import jwt from "jsonwebtoken";
import customError from "../utils/error.js";

const verifyAccessToken = (req, res, next) => {
	try {
		const authHeader = req.headers.authorization;
		if (!authHeader?.startsWith("Bearer ")) {
			throw customError("Missing or invalid authorization header", 401);
		}

		const token = authHeader.split(" ")[1];
		const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

		req.userId = payload.userId;
		req.companyId = payload.companyId;
		req.role = payload.role;
		req.departmentId = payload.departmentId;
		next();
	} catch (error) {
		if (error.name === "TokenExpiredError") {
			return next(customError("Access token expired", 401));
		}
		next(customError("Invalid or expired token", 401));
	}
};

export default verifyAccessToken;
