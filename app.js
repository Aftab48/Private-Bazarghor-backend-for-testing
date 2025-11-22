const express = require("express");
const router = express.Router();
const path = require("path");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const http = require("http");
require("./config/db")();

const utils = require("./api/helpers/utils/messages");
const { catchAsync } = require("./api/helpers/utils/catchAsync");
const app = express();
const server = http.createServer(app);
global.logger = require("./api/helpers/utils/logger");

const allowedOrigins = [
  "http://localhost:5173",
  "https://bazarghor-temp-web-frontend.vercel.app",
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(global.logger.morganInstance);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Import routes
const vendorRoutes = require("./api/routes/vendors/vendorAuth.route");
const vendorOrder = require("./api/routes/vendors/vendor.order.route");
const vendorSubscription = require("./api/routes/vendors/vendor.subscription.route");
const deliveryPartner = require("./api/routes/deliveryPartner/deliveryPartnerAuth.route");
const delivery = require("./api/routes/deliveryPartner/delivery.route");
const otpRoutes = require("./api/routes/otp.route");
const customerRoutes = require("./api/routes/customers/customerAuth.route");
const customerStoreRoutes = require("./api/routes/customers/store.route");
const customerCartRoutes = require("./api/routes/customers/cart.route");
const customerOrderRoutes = require("./api/routes/customers/order.route");
const adminRoutes = require("./api/routes/admin/adminAuth.Route");
const rolesPermissions = require("./api/routes/admin/role.routes");
const addStaff = require("./api/routes/staff/staffManagement.routes");
const addUsers = require("./api/routes/staff/userManegment.routes");
const productRoutes = require("./api/routes/products/product.routes");
const storeRoutes = require("./api/routes/store/store.routes");
const mapPlsRoutes = require("./api/routes/map-pls.route");

// Use routes
app.use("/api/vendors", vendorRoutes);
app.use("/api/vendor-order", vendorOrder);
app.use("/api/vendor-subscription", vendorSubscription);
app.use("/api/delivery-partner", deliveryPartner);
app.use("/api/delivery-order", delivery);
app.use("/api/otp", otpRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/customers/store", customerStoreRoutes);
app.use("/api/customers/cart", customerCartRoutes);
app.use("/api/customers/order", customerOrderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/roles-permissions", rolesPermissions);
app.use("/api/staff", addStaff);
app.use("/api/users", addUsers);
app.use("/api/products", productRoutes);
app.use("/api/store", storeRoutes);
app.use("/api/map-pls", mapPlsRoutes);

app.use(
  router.get(
    "/ping",
    catchAsync((req, res) => {
      res.message = "BazarGhorr server sending success response.";
      utils.successResponse({}, res);
    })
  )
);

server.listen(process.env.PORT, () => {
  logger.info(`server started at ${process.env.PORT} ✅`);
});
