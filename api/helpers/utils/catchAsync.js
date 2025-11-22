const {
  RESPONSE_CODE,
} = require("../../../config/constants/responseCodeConstant");
const responseCode = require("../utils/responseCode");
const logger = require("./logger");

const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => {
    logger.error("❌ Error caught in catchAsync:", {
      message: err.message,
      stack: err.stack,
      error: err,
    });
    res.status(responseCode?.internalServerError).json({
      code: RESPONSE_CODE.ERROR,
      message: err.message,
      data: {},
    });
  });
};

module.exports = { catchAsync };