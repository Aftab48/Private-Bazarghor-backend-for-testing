const {
  RESPONSE_CODE,
} = require("../../../config/constants/responseCodeConstant");
const responseCode = require("../utils/responseCode");
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => {
    console.error("❌ Error caught in catchAsync:");
    console.error("Message:", err.message);
    console.error("Stack:", err.stack);
    console.error("Full error:", err);
    res.status(responseCode?.internalServerError).json({
      code: RESPONSE_CODE.ERROR,
      message: err.message,
      data: {},
    });
  });
};

module.exports = { catchAsync };
