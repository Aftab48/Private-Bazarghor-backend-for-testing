const VendorSubscription = require("../models/vendorSubscription");
const Store = require("../models/store");
const User = require("../models/user");
const { formatDate, addDays } = require("../helpers/utils/date");
const { PLANS, PLAN_STATUS } = require("../../config/constants/planConstant");
const { ROLE } = require("../../config/constants/authConstant");

const assignFreeTrial = async (vendorId, storeId) => {
  try {
    if (!vendorId || !storeId) {
      return { success: false, error: "vendorId and storeId are required" };
    }

    const existingSub = await VendorSubscription.findOne({ vendorId, storeId });
    if (existingSub) {
      return {
        success: false,
        skipped: true,
        message: "Vendor already has a subscription. Free trial skipped.",
      };
    }

    const trialEnd = addDays(new Date(), PLANS.FREE_TRIAL.durationDays);
    const sub = await VendorSubscription.create({
      vendorId,
      storeId,
      planName: PLANS.FREE_TRIAL.name,
      monthlyFee: PLANS.FREE_TRIAL.monthlyFee,
      commissionPercent: PLANS.FREE_TRIAL.commissionPercent,
      startDate: formatDate(new Date()),
      endDate: trialEnd,
      status: PLAN_STATUS.ACTIVE,
      autoRenew: false,
      isFreeTrial: true,
    });

    await User.findByIdAndUpdate(
      vendorId,
      {
        $push: {
          subscriptions: {
            platformSubscription: sub._id,
            subscriptionPlan: PLANS.FREE_TRIAL.name,
            subscriptionExpiresAt: trialEnd,
          },
        },
      },
      { new: true }
    );

    await Store.findByIdAndUpdate(
      storeId,
      {
        $push: {
          subscriptions: {
            subscriptionId: sub._id,
            subscriptionPlan: PLANS.FREE_TRIAL.name,
            subscriptionExpiresAt: trialEnd,
            commissionPercent: PLANS.FREE_TRIAL.commissionPercent,
          },
        },
      },
      { new: true }
    );

    return { success: true, data: sub };
  } catch (err) {
    return { success: false, error: err.message || "Unknown error" };
  }
};

const purchaseSubscription = async ({
  vendorId,
  storeId,
  planName,
  autoRenew = false,
  updatedBy,
}) => {
  try {
    if (!vendorId || !storeId || !planName) {
      return { success: false, error: "vendorId, storeId & planName required" };
    }

    const plan = PLANS[planName.toUpperCase()];
    if (!plan) {
      return { success: false, error: "Invalid plan name" };
    }

    const endDate = addDays(new Date(), 30);
    let subscription = await VendorSubscription.findOne({ vendorId, storeId });

    if (!subscription) {
      subscription = await VendorSubscription.create({
        vendorId,
        storeId,
        planName: plan.name,
        monthlyFee: plan.monthlyFee,
        commissionPercent: plan.commissionPercent,
        startDate: formatDate(new Date()),
        endDate,
        status: PLAN_STATUS.ACTIVE,
        autoRenew,
        isFreeTrial: false,
        updatedBy: updatedBy ? [updatedBy] : [],
        deletedBy: null,
      });
    } else {
      if (
        subscription.planName === plan.name &&
        subscription.status === PLAN_STATUS.ACTIVE
      ) {
        return {
          success: false,
          error: "You already have an active subscription with this plan.",
        };
      }

      subscription.planName = plan.name;
      subscription.monthlyFee = plan.monthlyFee;
      subscription.commissionPercent = plan.commissionPercent;
      subscription.startDate = formatDate(new Date());
      subscription.endDate = endDate;
      subscription.status = PLAN_STATUS.ACTIVE;
      subscription.autoRenew = autoRenew;
      subscription.isFreeTrial = false;

      if (updatedBy) {
        subscription.updatedBy.push(updatedBy);
      }

      await subscription.save();
    }

    await User.findByIdAndUpdate(vendorId, {
      $set: { subscriptions: [] },
    });

    await User.findByIdAndUpdate(vendorId, {
      $push: {
        subscriptions: {
          platformSubscription: subscription._id,
          subscriptionPlan: plan.name,
          subscriptionExpiresAt: endDate,
        },
      },
    });

    await Store.findByIdAndUpdate(storeId, {
      $set: { subscriptions: [] },
    });

    await Store.findByIdAndUpdate(storeId, {
      $push: {
        subscriptions: {
          subscriptionId: subscription._id,
          subscriptionPlan: plan.name,
          subscriptionExpiresAt: endDate,
          commissionPercent: plan.commissionPercent,
        },
      },
    });

    return {
      success: true,
      message: "Subscription updated successfully",
      data: subscription,
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

const getSubscriptionsForVendor = async (vendorId) => {
  try {
    if (!vendorId) return { success: false, error: "vendorId required" };
    const sub = await VendorSubscription.findOne({ vendorId }).lean();
    return { success: true, data: sub || null };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

const getSubscriptionById = async (id) => {
  try {
    const sub = await VendorSubscription.findById(id).lean();
    if (!sub) return { success: false, notFound: true };
    return { success: true, data: sub };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

const cancelSubscription = async (id, updatedBy) => {
  try {
    const sub = await VendorSubscription.findById(id);
    if (!sub) return { success: false, notFound: true };
    sub.status = PLAN_STATUS.CANCELLED;
    sub.endDate = new Date();
    if (updatedBy) {
      if (!Array.isArray(sub.updatedBy)) {
        sub.updatedBy = [];
      }
      sub.updatedBy.push(updatedBy);
    }

    await sub.save();
    await User.findByIdAndUpdate(sub.vendorId, {
      $set: { subscriptions: [] },
    });

    await Store.findByIdAndUpdate(sub.storeId, {
      $set: { subscriptions: [] },
    });

    return { success: true, data: sub };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

const renewSubscription = async (
  id,
  { autoRenew, updatedBy, requestedByRole, requesterId }
) => {
  try {
    const sub = await VendorSubscription.findById(id);
    if (!sub) return { success: false, notFound: true };

    if (requestedByRole === ROLE.VENDOR) {
      if (String(sub.vendorId) !== String(requesterId)) {
        return {
          success: false,
          error: "You are not allowed to renew another vendor's subscription",
        };
      }
    }

    const newEndDate = addDays(new Date(), 30);
    sub.endDate = newEndDate;
    sub.status = PLAN_STATUS.ACTIVE;

    if (typeof autoRenew === "boolean") {
      sub.autoRenew = autoRenew;
    }

    if (updatedBy) {
      if (!Array.isArray(sub.updatedBy)) sub.updatedBy = [];
      sub.updatedBy.push(updatedBy);
    }

    await sub.save();
    await User.findByIdAndUpdate(sub.vendorId, {
      $set: { subscriptions: [] },
    });

    await User.findByIdAndUpdate(sub.vendorId, {
      $push: {
        subscriptions: {
          platformSubscription: sub._id,
          subscriptionPlan: sub.planName,
          subscriptionExpiresAt: newEndDate,
        },
      },
    });

    await Store.findByIdAndUpdate(sub.storeId, {
      $set: { subscriptions: [] },
    });

    await Store.findByIdAndUpdate(sub.storeId, {
      $push: {
        subscriptions: {
          subscriptionId: sub._id,
          subscriptionPlan: sub.planName,
          subscriptionExpiresAt: newEndDate,
          commissionPercent: sub.commissionPercent,
        },
      },
    });

    return {
      success: true,
      data: sub,
      message:
        requestedByRole === ROLE.ADMIN || requestedByRole === ROLE.SUPER_ADMIN
          ? "Subscription renewed by Admin"
          : "Subscription renewed successfully",
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

module.exports = {
  purchaseSubscription,
  getSubscriptionsForVendor,
  getSubscriptionById,
  cancelSubscription,
  renewSubscription,
  assignFreeTrial,
};
