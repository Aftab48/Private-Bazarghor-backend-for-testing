const PERMISSIONS = {
  // Admin account management
  VIEW_ADMINS: "view_admins",
  CREATE_ADMIN: "create_admin",
  UPDATE_ADMIN: "update_admin",
  DELETE_ADMIN: "delete_admin",
  MANAGE_ROLE_PERMISSIONS: "manage_role_permissions",
  // Sub admin management
  CREATE_SUB_ADMIN: "create_sub_admin",
  UPDATE_SUB_ADMIN: "update_sub_admin",
  DELETE_SUB_ADMIN: "delete_sub_admin",
  // Vendor management
  VIEW_VENDORS: "view_vendors",
  CREATE_VENDOR: "create_vendor",
  UPDATE_VENDOR: "update_vendor",
  DELETE_VENDOR: "delete_vendor",
  // Delivery partner
  VIEW_DELIVERY_PARTNERS: "view_delivery_partners",
  CREATE_DELIVERY_PARTNER: "create_delivery_partner",
  UPDATE_DELIVERY_PARTNER: "update_delivery_partner",
  DELETE_DELIVERY_PARTNER: "delete_delivery_partner",
  // Customer
  VIEW_CUSTOMERS: "view_customers",
  CREATE_CUSTOMER: "create_customer",
  UPDATE_CUSTOMER: "update_customer",
  DELETE_CUSTOMER: "delete_customer",
  // Products
  VIEW_PRODUCTS: "view_products",
  CREATE_PRODUCT: "create_product",
  UPDATE_PRODUCT: "update_product",
  DELETE_PRODUCT: "delete_product",
  // Orders
  VIEW_ORDERS: "view_orders",
  MANAGE_ORDERS: "manage_orders",
  // Store / subscription
  VIEW_STORES: "view_stores",
  MANAGE_SUBSCRIPTIONS: "manage_subscriptions",
  // Status verification (new)
  VERIFY_USER_STATUS: "verify_user_status",
};

const ROLE_DEFAULT_PERMISSIONS = {
  SUPER_ADMIN: Object.values(PERMISSIONS),
  ADMIN: [
    PERMISSIONS.VIEW_ADMINS,
    PERMISSIONS.CREATE_SUB_ADMIN,
    PERMISSIONS.UPDATE_SUB_ADMIN,
    PERMISSIONS.DELETE_SUB_ADMIN,
    PERMISSIONS.VIEW_VENDORS,
    PERMISSIONS.UPDATE_VENDOR,
    PERMISSIONS.VIEW_DELIVERY_PARTNERS,
    PERMISSIONS.UPDATE_DELIVERY_PARTNER,
    PERMISSIONS.VIEW_CUSTOMERS,
    PERMISSIONS.UPDATE_CUSTOMER,
    PERMISSIONS.VERIFY_USER_STATUS, // added so Admin can verify statuses
    PERMISSIONS.VIEW_PRODUCTS,
    PERMISSIONS.CREATE_PRODUCT,
    PERMISSIONS.UPDATE_PRODUCT,
    PERMISSIONS.DELETE_PRODUCT,
    PERMISSIONS.VIEW_ORDERS,
    PERMISSIONS.MANAGE_ORDERS,
    PERMISSIONS.VIEW_STORES,
  ],
  SUB_ADMIN: [
    PERMISSIONS.VIEW_VENDORS,
    PERMISSIONS.VIEW_PRODUCTS,
    PERMISSIONS.VIEW_ORDERS,
  ],
};

module.exports = { PERMISSIONS, ROLE_DEFAULT_PERMISSIONS };
