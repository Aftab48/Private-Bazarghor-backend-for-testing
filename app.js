const express = require("express");
const router = express.Router();
const path = require("path");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const http = require("http");
require("./config/db")();

const utils = require("./api/helpers/utils/messages");
const catchAsync = require("./api/helpers/utils/catchAsync");
const app = express();
const server = http.createServer(app);

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

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
  console.log(`server started at ${process.env.PORT} ✅`);
});
