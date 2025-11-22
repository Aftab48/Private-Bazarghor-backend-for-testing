const FEE_CONSTANTS = {
  // platform commission percent (e.g., 0.10 = 10%)
  PLATFORM_COMMISSION_PERCENT:
    parseFloat(process.env.PLATFORM_COMMISSION_PERCENT) || 0.1,
  // default tax percent (GST) applied on subtotal (example: 0.0 = 0%)
  DEFAULT_TAX_PERCENT: parseFloat(process.env.DEFAULT_TAX_PERCENT) || 0.0,
  // default per-order delivery charge (can be computed later)
  DEFAULT_DELIVERY_CHARGE:
    parseFloat(process.env.DEFAULT_DELIVERY_CHARGE) || 25,
  // delivery slabs (km) -> fee
  DELIVERY_SLABS: [
    { min: 0, max: 3, fee: 20 },
    { min: 3, max: 8, fee: 25 },
    { min: 8, max: 15, fee: 30 },
  ],
  // free delivery threshold for order value (₹)
  FREE_DELIVERY_THRESHOLD:
    parseFloat(process.env.FREE_DELIVERY_THRESHOLD) || 199,
  // subscription plan definitions (customer)
  CUSTOMER_PLANS: {
    SMART_SAVER: { name: "Smart Saver", price: 30, freeDeliveryAbove: 149 },
    SUPER_SAVER: {
      name: "Super Saver",
      price: 99,
      freeDeliveryAbove: 99,
      cashbackPercent: 0.03,
    },
  },
  // vendor subscription plans map to commission percent (overrides default commission)
  VENDOR_PLANS: {
    Basic: { monthlyFee: 199, commissionPercent: 0.05 },
    Standard: { monthlyFee: 299, commissionPercent: 0.03 },
    Premium: { monthlyFee: 499, commissionPercent: 0.0 },
  },
  // delivery partner earnings constants
  DELIVERY_PARTNER_BASE_FEE_MIN: 25,
  DELIVERY_PARTNER_BASE_FEE_MAX: 30,
  DELIVERY_PARTNER_INCENTIVE_MIN: 5,
  DELIVERY_PARTNER_INCENTIVE_MAX: 10,
  DELIVERY_PARTNER_INCENTIVE_THRESHOLD: 10, // orders per day
};

module.exports = {
  FEE_CONSTANTS,
};
