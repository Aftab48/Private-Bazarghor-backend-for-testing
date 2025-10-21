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
app.use(global.logger.morganInstance);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Import routes
const vendorRoutes = require("./api/routes/vendors/vendorAuth.route");
const deliveryPartner = require("./api/routes/deliveryPartner/deliveryPartnerAuth.route");
const otpRoutes = require("./api/routes/otp.route");
// const customerRoutes = require("./api/routes/customers/customerAuth.route");

// Use routes
app.use("/api/vendors", vendorRoutes);
app.use("/api/delivery-partner", deliveryPartner);
app.use("/api/otp", otpRoutes);

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
