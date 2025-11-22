const VendorSubscription = require("../models/vendorSubscription");
const {
  PLAN_STATUS,
  PLAN_PERMISSIONS,
} = require("../../config/constants/planConstant");

module.exports = function requiredFeature(featureKey) {
  return async (req, res, next) => {
    try {
      const vendorId = req.user;

      const subscription = await VendorSubscription.findOne({
        vendorId,
        status: PLAN_STATUS.ACTIVE,
      });

      if (!subscription) {
        return res.status(403).json({
          success: false,
          message: "No active subscription. Please buy a plan.",
        });
      }

      const plan = subscription.planName.toUpperCase();
      const features = PLAN_PERMISSIONS[plan];

      if (!features || !features[featureKey]) {
        return res.status(403).json({
          success: false,
          message: `Your current plan (${plan}) does not allow this feature.`,
        });
      }

      req.subscription = subscription;
      next();
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  };
};
