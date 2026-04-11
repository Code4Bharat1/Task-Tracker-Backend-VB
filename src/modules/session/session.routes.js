import { Router } from "express";
import verifyAccessToken from "../../middlewares/verifyAccessToken.middleware.js";
import verifyRole from "../../middlewares/verifyRole.middleware.js";
import Session from "./session.model.js";

const router = Router();

// GET /api/v1/sessions — list active sessions for the current user
router.get("/", verifyAccessToken, async (req, res, next) => {
  try {
    const { userId, companyId } = req;
    const sessions = await Session.find({ userId, companyId, isActive: true })
      .select("-refreshToken")
      .sort({ lastUsedAt: -1 });
    res.status(200).json({ sessions });
  } catch (err) { next(err); }
});

// DELETE /api/v1/sessions/:id — revoke a specific session
router.delete("/:id", verifyAccessToken, async (req, res, next) => {
  try {
    const { userId, companyId } = req;
    const session = await Session.findOneAndUpdate(
      { _id: req.params.id, userId, companyId },
      { isActive: false },
      { new: true }
    );
    if (!session) return res.status(404).json({ error: "Session not found" });
    res.status(200).json({ message: "Session revoked" });
  } catch (err) { next(err); }
});

// DELETE /api/v1/sessions — revoke all sessions for the current user (logout all)
router.delete("/", verifyAccessToken, async (req, res, next) => {
  try {
    const { userId, companyId } = req;
    await Session.updateMany({ userId, companyId, isActive: true }, { isActive: false });
    res.status(200).json({ message: "All sessions revoked" });
  } catch (err) { next(err); }
});

// admin: list all sessions for a user
router.get("/admin/user/:userId", verifyAccessToken, verifyRole("admin"), async (req, res, next) => {
  try {
    const { companyId } = req;
    const sessions = await Session.find({ userId: req.params.userId, companyId })
      .select("-refreshToken")
      .sort({ lastUsedAt: -1 });
    res.status(200).json({ sessions });
  } catch (err) { next(err); }
});

export default router;
