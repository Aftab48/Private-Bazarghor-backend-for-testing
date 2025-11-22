const PLANS = {
  FREE_TRIAL: {
    name: "FREE_TRIAL",
    monthlyFee: 0,
    commissionPercent: 0,
    durationDays: 15,
  },
  BASIC: {
    name: "Basic",
    monthlyFee: 199,
    commissionPercent: 5,
  },
  STANDARD: {
    name: "Standard",
    monthlyFee: 299,
    commissionPercent: 3,
  },
  PREMIUM: {
    name: "Premium",
    monthlyFee: 499,
    commissionPercent: 0,
  },
};

const PLAN_STATUS = {
  ACTIVE: "ACTIVE",
  CANCELLED: "CANCELLED",
  EXPIRED: "EXPIRED",
  PAUSED: "PAUSED",
};

const PLAN_PERMISSIONS = {
  FREE_TRIAL: {
    canAccessDashboard: true,
    canSeeBasicAnalytics: true,
    canListProducts: true,
    canAccessPremiumAnalytics: false,
    canUseBanners: false,
    hasTopSearchPlacement: false,
    hasDedicatedSupport: false,
  },
  BASIC: {
    canAccessDashboard: true,
    canSeeBasicAnalytics: true,
    canListProducts: true,
    canAccessPremiumAnalytics: false,
    canUseBanners: false,
    hasTopSearchPlacement: false,
    hasDedicatedSupport: false,
  },
  STANDARD: {
    canAccessDashboard: true,
    canSeeBasicAnalytics: true,
    canListProducts: true,
    canAccessPremiumAnalytics: true,
    canUseBanners: true,
    hasTopSearchPlacement: false,
    hasDedicatedSupport: true,
  },
  PREMIUM: {
    canAccessDashboard: true,
    canSeeBasicAnalytics: true,
    canListProducts: true,
    canAccessPremiumAnalytics: true,
    canUseBanners: true,
    hasTopSearchPlacement: true,
    hasDedicatedSupport: true,
  },
};

module.exports = { PLANS, PLAN_STATUS, PLAN_PERMISSIONS };
