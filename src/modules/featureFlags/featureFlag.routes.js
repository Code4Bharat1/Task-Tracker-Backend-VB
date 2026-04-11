import { Router } from "express";
import FeatureFlag from "./featureFlag.model.js";
import verifyAccessToken from "../../middlewares/verifyAccessToken.middleware.js";

const router = Router();

router.post("/", verifyAccessToken, async (req, res) => {
  const userRole = req.role;
  if (userRole !== "admin") {
    return res.status(403).json({ error: "You are not allowed to create feature flags" });
  }
  try {
    const featureFlag = await FeatureFlag.create({ ...req.body, companyId: req.companyId });
    res.status(201).json(featureFlag);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/", verifyAccessToken, async (req, res) => {
  const userRole = req.role;
  if (userRole !== "admin") {
    return res.status(403).json({ error: "You are not allowed to get feature flags" });
  }
  try {
    const featureFlags = await FeatureFlag.find();
    res.status(200).json(featureFlags);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:id", verifyAccessToken, async (req, res) => {
  const userRole = req.role;
  if (userRole !== "admin") {
    return res.status(403).json({ error: "You are not allowed to get feature flags" });
  }
  try {
    const featureFlag = await FeatureFlag.findById(req.params.id);
    res.status(200).json(featureFlag);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/:id", verifyAccessToken, async (req, res) => {
  const userRole = req.role;
  if (userRole !== "admin") {
    return res.status(403).json({ error: "You are not allowed to update feature flags" });
  }
  try {
    const featureFlag = await FeatureFlag.findByIdAndUpdate(req.params.id, req.body);
    res.status(200).json(featureFlag);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:id", verifyAccessToken, async (req, res) => {
  const userRole = req.role;
  if (userRole !== "admin") {
    return res.status(403).json({ error: "You are not allowed to delete feature flags" });
  }
  try {
    const featureFlag = await FeatureFlag.findByIdAndDelete(req.params.id);
    res.status(200).json(featureFlag);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;