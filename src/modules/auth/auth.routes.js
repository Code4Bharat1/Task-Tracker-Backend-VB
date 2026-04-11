import { Router } from "express";
import {
	changePasswordController,
	getMeController,
	googleAuth,
	googleRedirect,
	loginController,
	refreshController,
	forgotPasswordController,
} from "./auth.controller.js";
import verifyPasswordChangeToken from "../../middlewares/verifyPasswordChangeToken.middleware.js";
import verifyAccessToken from "../../middlewares/verifyAccessToken.middleware.js";

const router = Router();

router.post("/login", loginController);
router.post("/forgot", forgotPasswordController);
router.post("/change-password", verifyPasswordChangeToken, changePasswordController);
router.get("/me", verifyAccessToken, getMeController);
router.post("/refresh", refreshController);
router.get("/google", googleAuth);
router.get("/google/redirect", googleRedirect);

export default router;
