import { Router } from "express";
import verifyAccessToken from "../../middlewares/verifyAccessToken.middleware.js";
import ProjectReviewModel from "./projectReview.model.js";

const router = Router();

// Create review
router.post("/", verifyAccessToken, async (req, res) => {
  const { projectId, companyId, testerId, discussion, feedback } = req.body;
  const requesterCompanyId = req.companyId;

  // if companyId mismatch
  if (requesterCompanyId !== companyId) {
    return res.status(400).json({
      message: "Project review can be added only under same company"
    })
  };
  const data = await ProjectReviewModel.create({
    projectId, companyId, testerId, discussion, feedback
  })
  return res.status(202).json({
    message: "Review added successfully",
    data
  })

})
// Get All review
router.get("/", verifyAccessToken, async (req, res) => {
  try {
    const { projectId, testerId } = req.query;
    const companyId = req.companyId;

    const filter = { companyId };

    if (projectId) filter.projectId = projectId;
    if (testerId) filter.testerId = testerId;

    const reviews = await ProjectReviewModel.find(filter)
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Reviews fetched successfully",
      data: reviews
    });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// get single review
router.get("/:id", verifyAccessToken, async (req, res) => {
  try {
    const review = await ProjectReviewModel.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // company isolation check
    if (review.companyId.toString() !== req.companyId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    return res.status(200).json({
      message: "Review fetched successfully",
      data: review
    });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// update review
router.put("/:id", verifyAccessToken, async (req, res) => {
  try {
    const { discussion, feedback } = req.body;

    const review = await ProjectReviewModel.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (review.companyId.toString() !== req.companyId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    review.discussion = discussion ?? review.discussion;
    review.feedback = feedback ?? review.feedback;

    await review.save();

    return res.status(200).json({
      message: "Review updated successfully",
      data: review
    });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// delete review
router.delete("/:id", verifyAccessToken, async (req, res) => {
  try {
    const review = await ProjectReviewModel.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (review.companyId.toString() !== req.companyId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await review.deleteOne();

    return res.status(200).json({
      message: "Review deleted successfully"
    });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});


export default router;