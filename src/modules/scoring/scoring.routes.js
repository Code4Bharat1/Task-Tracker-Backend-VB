import { Router } from "express";
import verifyAccessToken from "../../middlewares/verifyAccessToken.middleware.js";
import { getLeaderboardService } from "./scoring.service.js";

const router = Router();

// GET /api/v1/leaderboard — any authenticated user
router.get("/", verifyAccessToken, async (req, res, next) => {
	try {
		const { companyId, departmentId } = req;
		const { period } = req.query;
		const result = await getLeaderboardService({ companyId, departmentId, period });
		res.status(200).json(result);
	} catch (err) {
		next(err);
	}
});

export default router;
