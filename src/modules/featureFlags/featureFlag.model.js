import mongoose from "mongoose";

const featureFlagSchema = new mongoose.Schema({
  flagKey: {
    type: String,
    required: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true
  },
  enabled: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const FeatureFlag = mongoose.model("FeatureFlag", featureFlagSchema);

export default FeatureFlag;