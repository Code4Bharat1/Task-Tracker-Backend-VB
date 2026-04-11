import verifyAccessToken from "../../middlewares/verifyAccessToken.middleware.js";
import ModuleReview from "./moduleReviews.model.js";
import { Router } from "express";

const router = Router();

router.post("/", verifyAccessToken, async (req, res) => {
  const userRole = req.role;
  const userId = req.userId;
  const { moduleId, decision, feedback } = req.body;
  if (userRole !== "admin" && userRole !== "department_head") {
    return res.status(403).json({ error: "You are not allowed to review modules" });
  }
  try {
    const moduleReview = await ModuleReview.create({
      moduleId,
      reviewerBy: userId,
      companyId: req.companyId,
      decision,
      feedback
    });
    res.status(201).json(moduleReview);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/", verifyAccessToken, async (req, res) => {
  const userRole = req.role;
  if (userRole !== "admin" && userRole !== "department_head") {
    return res.status(403).json({ error: "You are not allowed to review modules" });
  }
  try {
    const moduleReviews = await ModuleReview.find();
    res.status(200).json(moduleReviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:id", verifyAccessToken, async (req, res) => {
  const userRole = req.role;
  const { id } = req.params;
  if (userRole !== "admin" && userRole !== "department_head") {
    return res.status(403).json({ error: "You are not allowed to review modules" });
  }
  try {
    const moduleReview = await ModuleReview.findById(id);
    res.status(200).json(moduleReview);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/:id", verifyAccessToken, async (req, res) => {
  const userRole = req.role;
  const { id } = req.params;
  const { decision, feedback } = req.body;
  if (userRole !== "admin" && userRole !== "department_head") {
    return res.status(403).json({ error: "You are not allowed to review modules" });
  }
  try {
    const moduleReview = await ModuleReview.findByIdAndUpdate(id, {
      decision,
      feedback
    });
    res.status(200).json(moduleReview);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:id", verifyAccessToken, async (req, res) => {
  const userRole = req.role;
  const { id } = req.params;
  if (userRole !== "admin" && userRole !== "department_head") {
    return res.status(403).json({ error: "You are not allowed to review modules" });
  }
  try {
    const moduleReview = await ModuleReview.findByIdAndDelete(id);
    res.status(200).json(moduleReview);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;