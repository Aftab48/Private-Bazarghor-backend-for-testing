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
global.utils = utils;
global.logger = require("./api/helpers/utils/logger");

// CORS Configuration - Allow frontend to access API
const allowedOrigins = [
  'http://localhost:5173',
  'https://bazarghor-temp-web-frontend.vercel.app'
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(global.logger.morganInstance);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Import routes
const vendorRoutes = require("./api/routes/vendors/vendorAuth.route");
const deliveryPartner = require("./api/routes/deliveryPartner/deliveryPartnerAuth.route");
const otpRoutes = require("./api/routes/otp.route");
const customerRoutes = require("./api/routes/customers/customerAuth.route");
const adminRoutes = require("./api/routes/admin/adminAuth.Route");
// Use routes
app.use("/api/vendors", vendorRoutes);
app.use("/api/delivery-partner", deliveryPartner);
app.use("/api/otp", otpRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/admin", adminRoutes);

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